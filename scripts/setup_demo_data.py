import os
import sys
import json
import logging
import datetime
import numpy as np

# Ensure project root is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.config import settings
from backend.app.database import SessionLocal, engine, Base
from backend.app.models import (
    User, UserRole, River, Dam, Dataset, DatasetType, Scenario, ScenarioType,
    BreachFailureMode, Simulation, SimulationStatus, SolverType, ExecutionMode,
    FloodZone, RiskZone, ImpactRecord, RiskLevel, Shelter, EvacuationRoute, ShelterStatus
)
from simulation.engine import SimulationEngine
from gis.flood_analysis import FloodAnalysisEngine
from gis.risk_engine import RiskEngine
from gis.impact_engine import ImpactAnalysisEngine
from gis.exporter import GISExportEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def generate_demo_dataset():
    logger.info("Initializing PostGIS / SQLite schema...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_dam = db.query(Dam).filter(Dam.name == "Machhu-II Dam").first()
        if existing_dam:
            logger.info("Demo data already present in database.")
            return

        logger.info("Seeding Indian Dam (Machhu-II) and River (Machhu River)...")
        
        # 1. Machhu River
        river_coords = [
            [70.8200, 22.7000],
            [70.8450, 22.7300],
            [70.8833, 22.7667], # Dam location
            [70.8750, 22.8000],
            [70.8600, 22.8250],
            [70.8500, 22.8500],
            [70.8300, 22.8800]
        ]
        river = River(
            name="Machhu River",
            basin="Saurashtra River Basin",
            average_slope=0.0012,
            manning_n=0.035,
            length_km=130.0,
            geometry={"type": "LineString", "coordinates": river_coords},
            properties={
                "source": "Central Water Commission (CWC) Open Basin Records",
                "origin": "Madla Hills, Jasdan",
                "outflow": "Little Rann of Kutch"
            }
        )
        db.add(river)
        db.flush()

        # 2. Machhu-II Dam
        dam_lon, dam_lat = 70.8833, 22.7667
        dam = Dam(
            name="Machhu-II Dam",
            river_id=river.id,
            location={"type": "Point", "coordinates": [dam_lon, dam_lat]},
            latitude=dam_lat,
            longitude=dam_lon,
            height_m=24.0,
            crest_length_m=1200.0,
            capacity_mcm=110.0,
            full_reservoir_level_m=57.0,
            current_water_level_m=56.5,
            spillway_capacity_cumec=5700.0,
            dam_type="Earthen Dam with Masonry Spillway",
            state="Gujarat",
            district="Morbi",
            reservoir_geometry={
                "type": "Polygon",
                "coordinates": [[
                    [70.870, 22.740],
                    [70.895, 22.745],
                    [70.900, 22.765],
                    [70.8833, 22.7667],
                    [70.865, 22.760],
                    [70.870, 22.740]
                ]]
            },
            properties={
                "operator": "Water Resources Department, Govt of Gujarat",
                "purpose": "Irrigation and Disaster Defense",
                "commission_year": 1972
            }
        )
        db.add(dam)
        db.flush()

        # 3. Default Users (Admin, Modeller, Viewer, Citizen)
        users = [
            User(email="admin@damflood.gov.in", full_name="Disaster Operations Admin", role=UserRole.ADMIN),
            User(email="modeller@damflood.gov.in", full_name="Senior Hydrodynamic Modeller", role=UserRole.MODELLER),
            User(email="viewer@damflood.gov.in", full_name="District Magistrate Viewer", role=UserRole.VIEWER),
            User(email="citizen@morbi.in", full_name="Morbi Resident", role=UserRole.CITIZEN)
        ]
        for u in users:
            db.add(u)

        # 4. Shelters & Evacuation Routes
        shelters = [
            Shelter(
                name="Morbi Town Hall Relief Shelter",
                latitude=22.8250,
                longitude=70.8350,
                location={"type": "Point", "coordinates": [70.8350, 22.8250]},
                elevation_m=62.0,
                capacity=1500,
                status=ShelterStatus.OPERATIONAL,
                contact_phone="+91-2822-220100",
                address="Near Circuit House, High Elevation Ridge, Morbi"
            ),
            Shelter(
                name="VC Technical High School Shelter",
                latitude=22.8150,
                longitude=70.8200,
                location={"type": "Point", "coordinates": [70.8200, 22.8150]},
                elevation_m=58.5,
                capacity=800,
                status=ShelterStatus.OPERATIONAL,
                contact_phone="+91-2822-220105",
                address="Station Road, Higher Ground, Morbi"
            ),
            Shelter(
                name="APMC Emergency Community Center",
                latitude=22.8400,
                longitude=70.8100,
                location={"type": "Point", "coordinates": [70.8100, 22.8400]},
                elevation_m=65.0,
                capacity=2000,
                status=ShelterStatus.OPERATIONAL,
                contact_phone="+91-2822-220110",
                address="Sanala Road Bypass, Morbi"
            )
        ]
        for s in shelters:
            db.add(s)
        db.flush()

        # Evacuation Routes
        routes = [
            EvacuationRoute(
                name="Route 1: Low-Lying River Ward to Town Hall Shelter",
                origin_area="Darbar Gadh Riverfront",
                destination_shelter_id=shelters[0].id,
                geometry={
                    "type": "LineString",
                    "coordinates": [
                        [70.8600, 22.8200],
                        [70.8500, 22.8220],
                        [70.8350, 22.8250]
                    ]
                },
                length_km=2.8,
                safe_risk_level_capacity="Grade-A Elevated Arterial",
                road_type="Four-lane asphalt",
                status_note="Suggested route — elevated clearance above predicted Level 3 flood zone."
            ),
            EvacuationRoute(
                name="Route 2: Station Road to APMC Relief Center",
                origin_area="Morbi Railway Colony",
                destination_shelter_id=shelters[2].id,
                geometry={
                    "type": "LineString",
                    "coordinates": [
                        [70.8400, 22.8300],
                        [70.8250, 22.8350],
                        [70.8100, 22.8400]
                    ]
                },
                length_km=3.4,
                safe_risk_level_capacity="West Bypass High Ground",
                road_type="Divided Paved Highway",
                status_note="Suggested route — verify local emergency traffic controls."
            )
        ]
        for r in routes:
            db.add(r)

        # 5. Realistic Downstream Infrastructure Assets for Impact Analysis
        infrastructure_data = {
            "buildings": [],
            "roads": [
                {"name": "NH-8A Highway Segment", "geometry": {"type": "LineString", "coordinates": [[70.82, 22.80], [70.86, 22.82], [70.90, 22.84]]}},
                {"name": "Morbi Bypass Road", "geometry": {"type": "LineString", "coordinates": [[70.84, 22.78], [70.87, 22.81], [70.88, 22.83]]}}
            ],
            "bridges": [
                {"name": "Darbar Gadh Bridge", "location": [70.865, 22.818]},
                {"name": "Morbi Old Suspension Bridge Pier", "location": [70.862, 22.822]},
                {"name": "New Machhu Bypass Bridge", "location": [70.855, 22.835]}
            ],
            "schools": [
                {"name": "Morbi Municipal Primary School", "location": [70.868, 22.815]},
                {"name": "Nazarbaug Vidya Mandir", "location": [70.859, 22.825]}
            ],
            "hospitals": [
                {"name": "Morbi District General Civil Hospital", "location": [70.864, 22.821]},
                {"name": "Krishna Multi-Specialty Clinic", "location": [70.858, 22.830]}
            ],
            "agriculture": [
                {"name": "Machhu Riverbank Cotton Farm Belt", "geometry": {"type": "Polygon", "coordinates": [[[70.865, 22.78], [70.880, 22.78], [70.880, 22.80], [70.865, 22.80], [70.865, 22.78]]]}}
            ]
        }

        # Generate 150 synthetic building points across downstream floodplain
        np.random.seed(42)
        for i in range(150):
            b_lon = 70.850 + np.random.uniform(0.0, 0.04)
            b_lat = 22.780 + np.random.uniform(0.0, 0.07)
            infrastructure_data["buildings"].append({
                "id": f"BLDG-{i+1:03d}",
                "location": [round(b_lon, 5), round(b_lat, 5)],
                "estimated_occupants": np.random.choice([3, 4, 5, 6, 8])
            })

        # 6. Scenarios A, B, C, D
        scenarios = [
            Scenario(
                dam_id=dam.id,
                name="Scenario A: Extreme Dam-Break (100m Breach, Full Reservoir)",
                description="Sudden catastrophic breach failure under 100% full reservoir level (FRL) conditions.",
                scenario_type=ScenarioType.DAM_BREAK,
                failure_mode=BreachFailureMode.OVERTOPPING,
                reservoir_water_level_m=57.0,
                reservoir_level_pct=100.0,
                breach_width_m=100.0,
                breach_depth_m=18.0,
                breach_formation_time_hr=1.2,
                peak_discharge_cumec=7850.0,
                simulation_duration_hr=6.0,
                grid_resolution_m=30.0
            ),
            Scenario(
                dam_id=dam.id,
                name="Scenario B: River Blockage & Downstream Debris Failure",
                description="Landslide/debris river blockage followed by sudden surge wave.",
                scenario_type=ScenarioType.RIVER_BLOCKAGE,
                failure_mode=BreachFailureMode.PIPING,
                reservoir_water_level_m=52.0,
                reservoir_level_pct=91.0,
                breach_width_m=45.0,
                breach_depth_m=12.0,
                breach_formation_time_hr=2.0,
                peak_discharge_cumec=3400.0,
                simulation_duration_hr=4.0,
                grid_resolution_m=30.0
            ),
            Scenario(
                dam_id=dam.id,
                name="Scenario C: Significant Emergency Spillway Discharge",
                description="Emergency controlled release of 4,500 m3/s due to heavy upstream monsoon precipitation.",
                scenario_type=ScenarioType.CONTROLLED_RELEASE,
                failure_mode=BreachFailureMode.GRADUAL,
                reservoir_water_level_m=56.8,
                reservoir_level_pct=99.5,
                breach_width_m=20.0,
                breach_depth_m=8.0,
                breach_formation_time_hr=4.0,
                peak_discharge_cumec=4500.0,
                simulation_duration_hr=8.0,
                grid_resolution_m=30.0
            )
        ]
        for sc in scenarios:
            db.add(sc)
        db.flush()

        # 7. Run Baseline Simulation for Scenario A to generate all GIS & Impact products
        sc_a = scenarios[0]
        logger.info(f"Executing baseline reference hydrodynamic simulation for '{sc_a.name}'...")
        
        sim = Simulation(
            scenario_id=sc_a.id,
            solver_type=SolverType.HYBRID_COMPARISON,
            execution_mode=ExecutionMode.DEMO_REFERENCE,
            status=SimulationStatus.QUEUED,
            progress_pct=0.0
        )
        db.add(sim)
        db.flush()

        engine_sim = SimulationEngine()
        dam_dict = {
            "name": dam.name,
            "latitude": dam.latitude,
            "longitude": dam.longitude,
            "height_m": dam.height_m,
            "capacity_mcm": dam.capacity_mcm,
            "manning_n": river.manning_n,
            "spillway_capacity_cumec": dam.spillway_capacity_cumec
        }
        sc_dict = {
            "breach_width_m": sc_a.breach_width_m,
            "breach_depth_m": sc_a.breach_depth_m,
            "reservoir_water_level_m": sc_a.reservoir_water_level_m,
            "breach_formation_time_hr": sc_a.breach_formation_time_hr,
            "simulation_duration_hr": sc_a.simulation_duration_hr,
            "scenario_type": sc_a.scenario_type.value,
            "peak_discharge_cumec": sc_a.peak_discharge_cumec
        }

        # Run hydrodynamic solver
        common_res, comparison_data = engine_sim.run(
            sim.id, sc_a.id, sc_dict, dam_dict, solver_type="HYBRID_COMPARISON", execution_mode="DEMO_REFERENCE"
        )

        # Vector flood analysis
        flood_engine = FloodAnalysisEngine()
        flood_analysis = flood_engine.analyze_simulation_result(common_res)

        # Risk classification
        risk_engine = RiskEngine()
        risk_zones_dict = risk_engine.generate_risk_zones(common_res)

        # Impact / Exposure analysis
        impact_engine = ImpactAnalysisEngine()
        impact_results = impact_engine.analyze_exposure(risk_zones_dict, infrastructure_data)

        # GIS export generation
        export_dir = os.path.join(settings.STORAGE_PATH, "exports", sim.id)
        os.makedirs(export_dir, exist_ok=True)
        zip_path = os.path.join(export_dir, "flood_zones.zip")
        GISExportEngine.export_shapefile_zip(risk_zones_dict, {"simulation_id": sim.id}, zip_path)

        # Update simulation in database
        sim.status = SimulationStatus.COMPLETED
        sim.progress_pct = 100.0
        sim.current_stage = "Simulation completed successfully"
        sim.max_flood_extent_sqkm = common_res.total_area_flooded_sqkm
        sim.max_water_depth_m = common_res.peak_water_depth_m
        sim.max_flow_velocity_ms = common_res.peak_velocity_ms
        sim.min_arrival_time_min = common_res.min_arrival_time_min
        sim.computation_time_seconds = common_res.solver_execution_time_sec
        sim.common_format_json_path = os.path.join(settings.SIMULATION_WORKSPACE_PATH, sim.id, "common_simulation_result.json")
        sim.started_at = datetime.datetime.utcnow() - datetime.timedelta(seconds=common_res.solver_execution_time_sec)
        sim.completed_at = datetime.datetime.utcnow()
        sim.logs_json = [
            {"time": "00:00:01", "stage": "VALIDATING", "message": "Hydrological parameters validated."},
            {"time": "00:00:02", "stage": "RUNNING_DELFT3D", "message": "Delft3D Flexible Mesh 2D SWE solved."},
            {"time": "00:00:03", "stage": "RUNNING_SPH", "message": "SPH particle kinematic bore resolved."},
            {"time": "00:00:04", "stage": "GENERATING_GIS", "message": "Contour polygons and risk tiers classified."},
            {"time": "00:00:05", "stage": "RUNNING_IMPACT", "message": "Infrastructure exposure overlaid."},
            {"time": "00:00:06", "stage": "COMPLETED", "message": "Outputs exported to SHP/KML/GeoJSON."}
        ]

        # Save Flood Zones
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

        # Save Risk Zones
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

        # Save Impact Record
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

        db.commit()
        logger.info("Successfully generated and seeded complete Indian dam demo dataset with hydrodynamic results!")

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed demo data: {e}", exc_info=True)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    generate_demo_dataset()
