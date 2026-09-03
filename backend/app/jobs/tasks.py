import os
import datetime
import logging
import traceback
from typing import Dict, Any

from backend.app.database import SessionLocal
from backend.app.config import settings
from backend.app.models import (
    Simulation, SimulationStatus, Scenario, Dam, River, FloodZone, RiskZone,
    ImpactRecord, Alert, RiskLevel
)
from simulation.engine import SimulationEngine
from gis.flood_analysis import FloodAnalysisEngine
from gis.risk_engine import RiskEngine
from gis.impact_engine import ImpactAnalysisEngine
from gis.exporter import GISExportEngine

logger = logging.getLogger(__name__)

def execute_simulation_job(simulation_id: str):
    """
    Background worker job for running hydrodynamic simulation lifecycle.
    """
    db = SessionLocal()
    try:
        sim = db.query(Simulation).filter(Simulation.id == simulation_id).first()
        if not sim:
            logger.error(f"Simulation {simulation_id} not found.")
            return

        scenario = db.query(Scenario).filter(Scenario.id == sim.scenario_id).first()
        if not scenario:
            sim.status = SimulationStatus.FAILED
            sim.error_message = f"Scenario {sim.scenario_id} not found."
            db.commit()
            return

        dam = db.query(Dam).filter(Dam.id == scenario.dam_id).first()
        river = db.query(River).filter(River.id == dam.river_id).first() if dam else None

        sim.started_at = datetime.datetime.utcnow()
        sim.status = SimulationStatus.VALIDATING
        sim.progress_pct = 5.0
        sim.current_stage = "Validating parameters"
        sim.logs_json = [{"time": str(datetime.datetime.utcnow()), "stage": "VALIDATING", "message": "Validating simulation inputs."}]
        db.commit()

        def update_progress(stage: str, pct: float, msg: str):
            sim.current_stage = msg
            sim.progress_pct = pct
            # Map solver stage to SimulationStatus enum
            status_enum = getattr(SimulationStatus, stage, SimulationStatus.PROCESSING)
            sim.status = status_enum
            logs = list(sim.logs_json or [])
            logs.append({"time": str(datetime.datetime.utcnow()), "stage": stage, "message": msg})
            sim.logs_json = logs
            db.commit()

        # Execute Hydrodynamic Simulation
        engine = SimulationEngine()
        dam_dict = {
            "name": dam.name if dam else "Dam",
            "latitude": dam.latitude if dam else 22.76,
            "longitude": dam.longitude if dam else 70.88,
            "height_m": dam.height_m if dam else 24.0,
            "capacity_mcm": dam.capacity_mcm if dam else 110.0,
            "manning_n": river.manning_n if river else 0.035,
            "spillway_capacity_cumec": dam.spillway_capacity_cumec if dam else 5000.0
        }
        sc_dict = {
            "breach_width_m": scenario.breach_width_m,
            "breach_depth_m": scenario.breach_depth_m,
            "reservoir_water_level_m": scenario.reservoir_water_level_m,
            "breach_formation_time_hr": scenario.breach_formation_time_hr,
            "simulation_duration_hr": scenario.simulation_duration_hr,
            "scenario_type": scenario.scenario_type.value,
            "peak_discharge_cumec": scenario.peak_discharge_cumec
        }

        common_res, comparison_data = engine.run(
            simulation_id=sim.id,
            scenario_id=scenario.id,
            scenario_params=sc_dict,
            dam_info=dam_dict,
            solver_type=sim.solver_type.value,
            execution_mode=sim.execution_mode.value,
            progress_callback=update_progress
        )

        update_progress("GENERATING_FLOOD", 80.0, "Vectorizing flood extent & depth contours...")
        flood_engine = FloodAnalysisEngine()
        flood_analysis = flood_engine.analyze_simulation_result(common_res)

        update_progress("GENERATING_GIS", 85.0, "Classifying risk polygons and packaging SHP/KML/GeoJSON...")
        risk_engine = RiskEngine()
        risk_zones_dict = risk_engine.generate_risk_zones(common_res)

        # Export GIS Products
        export_dir = os.path.join(settings.STORAGE_PATH, "exports", sim.id)
        os.makedirs(export_dir, exist_ok=True)
        zip_path = os.path.join(export_dir, "flood_zones.zip")
        GISExportEngine.export_shapefile_zip(risk_zones_dict, {"simulation_id": sim.id}, zip_path)

        update_progress("RUNNING_IMPACT", 90.0, "Performing infrastructure exposure overlay...")
        # Infrastructure sample data
        infrastructure_data = {
            "buildings": [{"id": f"B-{i}", "location": [70.86 + (i%10)*0.003, 22.80 + (i//10)*0.003], "estimated_occupants": 4.5} for i in range(100)],
            "roads": [{"name": "Arterial Road", "geometry": {"type": "LineString", "coordinates": [[70.83, 22.78], [70.87, 22.83]]}}],
            "bridges": [{"name": "River Crossing Bridge", "location": [70.862, 22.822]}],
            "schools": [{"name": "Municipal School", "location": [70.868, 22.815]}],
            "hospitals": [{"name": "Civil Hospital", "location": [70.864, 22.821]}],
            "agriculture": [{"name": "River Farmland", "geometry": {"type": "Polygon", "coordinates": [[[70.86, 22.78], [70.88, 22.78], [70.88, 22.80], [70.86, 22.80], [70.86, 22.78]]]}}]
        }
        impact_engine = ImpactAnalysisEngine()
        impact_results = impact_engine.analyze_exposure(risk_zones_dict, infrastructure_data)

        # Persist Flood Zones
        for step in flood_analysis["timestep_series"]:
            fz = FloodZone(
                simulation_id=sim.id,
                time_step_min=step["time_minutes"],
                geometry=step["geometry"],
                depth_min_m=0.1,
                depth_max_m=step["max_depth_m"],
                avg_velocity_ms=step["max_velocity_ms"] * 0.6,
                area_sqkm=step["area_sqkm"]
            )
            db.add(fz)

        # Persist Risk Zones
        for l_key, rz_data in risk_zones_dict.items():
            rz = RiskZone(
                simulation_id=sim.id,
                risk_level=getattr(RiskLevel, l_key),
                geometry=rz_data["geometry"],
                min_arrival_time_min=rz_data["min_arrival_time_min"],
                max_depth_m=rz_data["max_depth_m"],
                max_velocity_ms=rz_data["max_velocity_ms"],
                area_sqkm=rz_data["area_sqkm"]
            )
            db.add(rz)

        # Persist Impact Record
        ir = ImpactRecord(
            simulation_id=sim.id,
            exposed_buildings_count=impact_results["exposed_buildings_count"],
            exposed_roads_length_km=impact_results["exposed_roads_length_km"],
            exposed_bridges_count=impact_results["exposed_bridges_count"],
            exposed_schools_count=impact_results["exposed_schools_count"],
            exposed_hospitals_count=impact_results["exposed_hospitals_count"],
            exposed_population_estimate=impact_results["exposed_population_estimate"],
            exposed_agriculture_sqkm=impact_results["exposed_agriculture_sqkm"],
            critical_facilities_list=impact_results["critical_facilities_list"],
            exposure_by_risk_level=impact_results["exposure_by_risk_level"],
            summary_report=impact_results["summary_report"]
        )
        db.add(ir)

        # Create Emergency Alert for Level 3 polygon
        if "LEVEL_3_CRITICAL" in risk_zones_dict and risk_zones_dict["LEVEL_3_CRITICAL"]["area_sqkm"] > 0:
            alert = Alert(
                simulation_id=sim.id,
                risk_level=RiskLevel.LEVEL_3_CRITICAL,
                target_geometry=risk_zones_dict["LEVEL_3_CRITICAL"]["geometry"],
                title="CRITICAL FLOOD ALERT: High Inundation Risk Area",
                message="Hydrodynamic simulation predicts rapid flood arrival exceeding 1.5m depth. Evacuate immediately to designated relief shelters.",
                severity="CRITICAL",
                expected_arrival_time_min=common_res.min_arrival_time_min,
                nearest_shelter_name="Morbi Town Hall Relief Shelter",
                expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            )
            db.add(alert)

        # Mark Simulation Complete
        sim.status = SimulationStatus.COMPLETED
        sim.progress_pct = 100.0
        sim.current_stage = "Simulation completed successfully"
        sim.max_flood_extent_sqkm = common_res.total_area_flooded_sqkm
        sim.max_water_depth_m = common_res.peak_water_depth_m
        sim.max_flow_velocity_ms = common_res.peak_velocity_ms
        sim.min_arrival_time_min = common_res.min_arrival_time_min
        sim.computation_time_seconds = common_res.solver_execution_time_sec
        sim.completed_at = datetime.datetime.utcnow()
        db.commit()

        logger.info(f"Simulation {simulation_id} completed successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"Simulation {simulation_id} failed: {e}", exc_info=True)
        try:
            sim = db.query(Simulation).filter(Simulation.id == simulation_id).first()
            if sim:
                sim.status = SimulationStatus.FAILED
                sim.error_message = str(e)
                sim.current_stage = f"Failed: {str(e)}"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
