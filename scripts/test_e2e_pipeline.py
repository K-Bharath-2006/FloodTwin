import os
import sys

# Set OpenBLAS and OMP thread pool limits for Windows stability
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import json
import zipfile
import logging
import datetime

# Add workspace to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import SessionLocal, Base, engine
from backend.app.models import (
    Dam, River, Scenario, ScenarioType, BreachFailureMode, Simulation,
    SimulationStatus, SolverType, ExecutionMode, FloodZone, RiskZone,
    ImpactRecord, RiskLevel, Shelter, EvacuationRoute, Alert, Device,
    DeliveryChannel, SatelliteObservation
)
from simulation.engine import SimulationEngine
from gis.flood_analysis import FloodAnalysisEngine
from gis.risk_engine import RiskEngine
from gis.impact_engine import ImpactAnalysisEngine
from gis.exporter import GISExportEngine
from ge.validator import GEEValidationEngine
from backend.app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("E2E_TEST")

def run_full_end_to_end_test():
    logger.info("================================================================")
    logger.info("STARTING DAM BREAK HYDRODYNAMIC INUNDATION END-TO-END PIPELINE")
    logger.info("================================================================")

    db = SessionLocal()
    try:
        # Step 1: Verify Dam & River Ingestion
        logger.info("[STEP 1/10] Verifying Dam & River Hydrological Entities...")
        dam = db.query(Dam).filter(Dam.name == "Machhu-II Dam").first()
        river = db.query(River).filter(River.name == "Machhu River").first()
        assert dam is not None, "Dam entity not found in database."
        assert river is not None, "River entity not found in database."
        logger.info(f"  ✓ Found Dam: {dam.name} (Height: {dam.height_m}m, Capacity: {dam.capacity_mcm} MCM)")
        logger.info(f"  ✓ Found River: {river.name} (Slope: {river.average_slope}, Manning's n: {river.manning_n})")

        # Step 2: Create Dynamic Dam-Break Scenario
        logger.info("[STEP 2/10] Generating What-If Hydrodynamic Breach Scenario...")
        sc = Scenario(
            dam_id=dam.id,
            name="E2E Verification Scenario: 80m Breach Catastrophic Failure",
            scenario_type=ScenarioType.DAM_BREAK,
            failure_mode=BreachFailureMode.PIPING,
            reservoir_water_level_m=57.0,
            reservoir_level_pct=100.0,
            breach_width_m=80.0,
            breach_depth_m=16.0,
            breach_formation_time_hr=1.2,
            peak_discharge_cumec=6420.0,
            simulation_duration_hr=4.0,
            grid_resolution_m=30.0
        )
        db.add(sc)
        db.commit()
        db.refresh(sc)
        logger.info(f"  ✓ Created Scenario ID: {sc.id} (Calculated Qp: {sc.peak_discharge_cumec} m3/s)")

        # Step 3: Run Multi-Solver Hydrodynamic Simulation (Delft3D + SPH Hybrid)
        logger.info("[STEP 3/10] Dispatching Hydrodynamic Solvers (Delft3D-FM + SPH)...")
        sim = Simulation(
            scenario_id=sc.id,
            solver_type=SolverType.HYBRID_COMPARISON,
            execution_mode=ExecutionMode.DEMO_REFERENCE,
            status=SimulationStatus.QUEUED,
            progress_pct=0.0
        )
        db.add(sim)
        db.commit()
        db.refresh(sim)

        sim_engine = SimulationEngine()
        dam_dict = {
            "name": dam.name, "latitude": dam.latitude, "longitude": dam.longitude,
            "height_m": dam.height_m, "capacity_mcm": dam.capacity_mcm,
            "manning_n": river.manning_n, "spillway_capacity_cumec": dam.spillway_capacity_cumec
        }
        sc_dict = {
            "breach_width_m": sc.breach_width_m, "breach_depth_m": sc.breach_depth_m,
            "reservoir_water_level_m": sc.reservoir_water_level_m,
            "breach_formation_time_hr": sc.breach_formation_time_hr,
            "simulation_duration_hr": sc.simulation_duration_hr,
            "scenario_type": sc.scenario_type.value,
            "peak_discharge_cumec": sc.peak_discharge_cumec
        }

        common_res, comp_payload = sim_engine.run(
            sim.id, sc.id, sc_dict, dam_dict, solver_type="HYBRID_COMPARISON", execution_mode="DEMO_REFERENCE"
        )

        assert common_res.total_area_flooded_sqkm > 0.0
        assert common_res.peak_water_depth_m > 0.0
        assert common_res.peak_velocity_ms > 0.0
        logger.info(f"  ✓ Hydrodynamic Simulation Succeeded: Area={common_res.total_area_flooded_sqkm} km2, PeakDepth={common_res.peak_water_depth_m} m, PeakVel={common_res.peak_velocity_ms} m/s")

        # Step 4: Vector Flood Analysis
        logger.info("[STEP 4/10] Vectorizing Hydrodynamic Inundation Rasters...")
        flood_engine = FloodAnalysisEngine()
        flood_analysis = flood_engine.analyze_simulation_result(common_res)
        assert len(flood_analysis["timestep_series"]) > 0
        logger.info(f"  ✓ Generated {len(flood_analysis['timestep_series'])} discrete temporal flood wave contours.")

        # Step 5: Risk Engine Classification (Level 0 to Level 3)
        logger.info("[STEP 5/10] Classifying Hydrodynamic Hazard Risk Tiers (L0-L3)...")
        risk_engine = RiskEngine()
        risk_zones_dict = risk_engine.generate_risk_zones(common_res)
        assert "LEVEL_3_CRITICAL" in risk_zones_dict
        assert "LEVEL_2_HIGH_RISK" in risk_zones_dict
        assert "LEVEL_1_WARNING" in risk_zones_dict
        logger.info(f"  ✓ Level 3 Critical Area: {risk_zones_dict['LEVEL_3_CRITICAL']['area_sqkm']} km2")
        logger.info(f"  ✓ Level 2 High Risk Area: {risk_zones_dict['LEVEL_2_HIGH_RISK']['area_sqkm']} km2")
        logger.info(f"  ✓ Level 1 Warning Area: {risk_zones_dict['LEVEL_1_WARNING']['area_sqkm']} km2")

        # Step 6: Impact & Exposure Analysis
        logger.info("[STEP 6/10] Calculating Infrastructure & Population Exposure...")
        infra = {
            "buildings": [{"location": [70.860, 22.820], "estimated_occupants": 5}, {"location": [70.865, 22.825], "estimated_occupants": 4}],
            "roads": [{"name": "NH-8A", "geometry": {"type": "LineString", "coordinates": [[70.84, 22.80], [70.88, 22.84]]}}],
            "bridges": [{"name": "Darbar Gadh Bridge", "location": [70.865, 22.818]}],
            "schools": [{"name": "Municipal Primary School", "location": [70.868, 22.815]}],
            "hospitals": [{"name": "Morbi Civil Hospital", "location": [70.864, 22.821]}],
            "agriculture": [{"name": "Farmland", "geometry": {"type": "Polygon", "coordinates": [[[70.86, 22.78], [70.88, 22.78], [70.88, 22.80], [70.86, 22.80], [70.86, 22.78]]]}}]
        }
        impact_engine = ImpactAnalysisEngine()
        impact = impact_engine.analyze_exposure(risk_zones_dict, infra)
        assert impact["exposed_buildings_count"] > 0
        assert impact["summary_report"]["disclaimer"] is not None
        logger.info(f"  ✓ Exposed Buildings: {impact['exposed_buildings_count']} | Population: {impact['exposed_population_estimate']}")

        # Step 7: Automated GIS Exports (Shapefile zip, KML, GeoJSON)
        logger.info("[STEP 7/10] Generating Automated Zero-QGIS GIS Export Bundles...")
        export_dir = os.path.join(settings.STORAGE_PATH, "exports", sim.id)
        os.makedirs(export_dir, exist_ok=True)
        
        # Shapefile Zip
        zip_path = os.path.join(export_dir, "flood_zones.zip")
        GISExportEngine.export_shapefile_zip(risk_zones_dict, {"simulation_id": sim.id}, zip_path)
        assert os.path.exists(zip_path)
        with zipfile.ZipFile(zip_path, "r") as z:
            names = z.namelist()
            assert any(f.endswith(".shp") for f in names), "Missing .shp in zip"
            assert any(f.endswith(".shx") for f in names), "Missing .shx in zip"
            assert any(f.endswith(".dbf") for f in names), "Missing .dbf in zip"
            assert any(f.endswith(".prj") for f in names), "Missing .prj in zip"
        logger.info(f"  ✓ Shapefile Bundle Created: {zip_path} ({os.path.getsize(zip_path)} bytes)")

        # GeoJSON & KML
        geojson_str = GISExportEngine.export_geojson(risk_zones_dict, {"simulation_id": sim.id})
        kml_str = GISExportEngine.export_kml(risk_zones_dict, {"simulation_id": sim.id})
        assert "FeatureCollection" in geojson_str
        assert "<kml" in kml_str
        logger.info("  ✓ GeoJSON & KML Standards Verified.")

        # Step 8: Google Earth Engine Satellite Validation & IoU
        logger.info("[STEP 8/10] Performing GEE Satellite Validation & IoU Calculation...")
        gee = GEEValidationEngine()
        sat_val = gee.validate_simulation_with_satellite(risk_zones_dict["LEVEL_3_CRITICAL"]["geometry"])
        assert sat_val["iou_score"] is not None
        assert sat_val["iou_score"] >= 0.0
        logger.info(f"  ✓ Sentinel-1 SAR Validation: IoU Score = {sat_val['iou_score']}, Overlap = {sat_val['overlap_pct']}%")

        # Step 9: Reverse Flood Scenario Hypothesis Ranking
        logger.info("[STEP 9/10] Running Reverse Flood Hypothesis Matching...")
        cand_scenarios = [{"id": sc.id, "name": sc.name, "dam_name": dam.name, "geometry": risk_zones_dict["LEVEL_3_CRITICAL"]["geometry"]}]
        rev_match = gee.reverse_scenario_match(sat_val["observed_geometry"], cand_scenarios)
        assert len(rev_match["top_matched_scenarios"]) > 0
        logger.info(f"  ✓ Top Ranked Scenario: {rev_match['top_matched_scenarios'][0]['scenario_name']} (IoU: {rev_match['top_matched_scenarios'][0]['iou_similarity']})")

        # Step 10: Complete Simulation State in DB
        sim.status = SimulationStatus.COMPLETED
        sim.progress_pct = 100.0
        sim.max_flood_extent_sqkm = common_res.total_area_flooded_sqkm
        sim.max_water_depth_m = common_res.peak_water_depth_m
        sim.max_flow_velocity_ms = common_res.peak_velocity_ms
        sim.min_arrival_time_min = common_res.min_arrival_time_min
        sim.completed_at = datetime.datetime.utcnow()
        db.commit()

        logger.info("================================================================")
        logger.info("ALL 10/10 END-TO-END PIPELINE STEPS COMPLETED & VERIFIED!")
        logger.info("================================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_full_end_to_end_test()
