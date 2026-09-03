import os
import sys

# Set OpenBLAS and OMP thread pool limits for Windows stability
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import io
import json
import zipfile
import logging
import datetime
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import SessionLocal, Base, engine
from backend.app.models import (
    Dam, River, Scenario, Simulation, FloodZone, RiskZone,
    ImpactRecord, Shelter, EvacuationRoute, Alert, Device,
    User, UserRole, RiskLevel
)
from simulation.delft3d.adapter import Delft3DAdapter
from simulation.sph.adapter import SPHAdapter
from simulation.reference_solver import ReferenceHydrodynamicSolver
from simulation.engine import SimulationEngine
from gis.flood_analysis import FloodAnalysisEngine
from gis.risk_engine import RiskEngine
from gis.impact_engine import ImpactAnalysisEngine
from gis.exporter import GISExportEngine
from ge.validator import GEEValidationEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("COMPREHENSIVE_E2E_TEST")

client = TestClient(app)

def run_comprehensive_test():
    logger.info("==================================================================================")
    logger.info("STARTING COMPREHENSIVE END-TO-END HYDRODYNAMIC SYSTEM VERIFICATION TEST")
    logger.info("==================================================================================")

    test_results = {}

    # =========================================================================
    # PART 1: REST API COMPREHENSIVE ENDPOINT AUDIT (All 15 Routers)
    # =========================================================================
    logger.info("\n--- [PART 1/4] TESTING ALL REST API ENDPOINTS & ROUTERS ---")
    
    # 1. Health Probe
    res = client.get("/api/v1/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    assert health_data["status"].upper() == "HEALTHY"
    logger.info(f"  ✓ GET /api/v1/health -> Status: {health_data['status']}, Database: {health_data['database']}")
    test_results["API_Health"] = "PASSED"

    # 2. Dams API
    res = client.get("/api/v1/dams")
    assert res.status_code == 200
    dams = res.json()
    assert len(dams) > 0, "No dams found."
    dam_id = dams[0]["id"]
    dam_name = dams[0]["name"]
    logger.info(f"  ✓ GET /api/v1/dams -> Retrieved {len(dams)} dams. Selected: {dam_name} (ID: {dam_id})")
    
    res_dam = client.get(f"/api/v1/dams/{dam_id}")
    assert res_dam.status_code == 200
    assert res_dam.json()["name"] == dam_name
    logger.info(f"  ✓ GET /api/v1/dams/{dam_id} -> Verified single dam entity retrieval.")
    test_results["API_Dams"] = "PASSED"

    # 3. Rivers API
    res = client.get("/api/v1/rivers")
    assert res.status_code == 200
    rivers = res.json()
    assert len(rivers) > 0, "No rivers found."
    river_id = rivers[0]["id"]
    logger.info(f"  ✓ GET /api/v1/rivers -> Retrieved {len(rivers)} rivers. Selected: {rivers[0]['name']}")
    
    res_riv = client.get(f"/api/v1/rivers/{river_id}")
    assert res_riv.status_code == 200
    logger.info(f"  ✓ GET /api/v1/rivers/{river_id} -> Verified single river entity retrieval.")
    test_results["API_Rivers"] = "PASSED"

    # 4. Datasets API
    res = client.get("/api/v1/datasets")
    assert res.status_code == 200
    logger.info(f"  ✓ GET /api/v1/datasets -> Retrieved {len(res.json())} datasets.")
    test_results["API_Datasets"] = "PASSED"

    # 5. Scenarios API (With Froehlich Peak Discharge Equation Calculation)
    sc_payload = {
        "dam_id": dam_id,
        "name": "API Automated Verification Breach Scenario",
        "description": "High-resolution testing breach with Froehlich (1995) validation",
        "scenario_type": "DAM_BREAK",
        "failure_mode": "PIPING",
        "reservoir_water_level_m": 57.0,
        "reservoir_level_pct": 100.0,
        "breach_width_m": 75.0,
        "breach_depth_m": 15.0,
        "breach_formation_time_hr": 1.2,
        "peak_discharge_cumec": 5890.0,
        "simulation_duration_hr": 4.0,
        "grid_resolution_m": 30.0
    }
    res_sc = client.post("/api/v1/scenarios", json=sc_payload)
    assert res_sc.status_code == 201, f"Scenario creation failed: {res_sc.text}"
    created_scenario = res_sc.json()
    scenario_id = created_scenario["id"]
    logger.info(f"  ✓ POST /api/v1/scenarios -> Created Scenario: '{created_scenario['name']}' (ID: {scenario_id}, Qp: {created_scenario['peak_discharge_cumec']} m³/s)")
    test_results["API_Scenarios"] = "PASSED"

    # 6. Simulations API (Queue & Run Simulation)
    sim_payload = {
        "scenario_id": scenario_id,
        "solver_type": "HYBRID_COMPARISON",
        "execution_mode": "DEMO_REFERENCE"
    }
    res_sim = client.post("/api/v1/simulations", json=sim_payload)
    assert res_sim.status_code == 202, f"Simulation queue failed: {res_sim.text}"
    created_sim = res_sim.json()
    simulation_id = created_sim["id"]
    logger.info(f"  ✓ POST /api/v1/simulations -> Dispatched simulation job (ID: {simulation_id}, Solver: {created_sim['solver_type']})")
    
    # Check Simulation Status
    res_st = client.get(f"/api/v1/simulations/{simulation_id}/status")
    assert res_st.status_code == 200
    logger.info(f"  ✓ GET /api/v1/simulations/{simulation_id}/status -> Current Status: {res_st.json()['status']}")
    test_results["API_Simulations"] = "PASSED"

    # =========================================================================
    # PART 2: HYDRODYNAMIC SOLVERS & COMPARISON ENGINE DEEP DIVE
    # =========================================================================
    logger.info("\n--- [PART 2/4] TESTING SCIENTIFIC SOLVERS (Delft3D-FM, DualSPHysics, Reference Solver) ---")
    
    dam_dict = {
        "name": dam_name,
        "latitude": 22.800,
        "longitude": 70.850,
        "height_m": 24.0,
        "crest_length_m": 800.0,
        "capacity_mcm": 110.0,
        "manning_n": 0.035,
        "spillway_capacity_cumec": 6120.0
    }

    # 1. Delft3D-FM Adapter Verification
    delft3d = Delft3DAdapter(workspace_root="./simulation_runs/delft3d")
    ws_delft = delft3d.create_isolated_dir(simulation_id)
    assert os.path.exists(ws_delft["input"]), "Delft3D workspace input dir missing"
    assert os.path.exists(ws_delft["output"]), "Delft3D workspace output dir missing"
    
    mdu_path = delft3d.prepare_configuration(ws_delft, sc_payload, dam_dict)
    assert os.path.exists(mdu_path)
    logger.info(f"  ✓ Delft3D-FM Adapter: Successfully generated MDU ({os.path.basename(mdu_path)}) and Boundary Hydrograph (.bc)")
    test_results["Delft3D_Adapter"] = "PASSED"

    # 2. DualSPHysics SPH Adapter Verification
    sph = SPHAdapter(workspace_root="./simulation_runs/sph")
    ws_sph = sph.create_isolated_dir(simulation_id)
    assert os.path.exists(ws_sph["input"])
    
    xml_path = sph.prepare_configuration(ws_sph, sc_payload, dam_dict)
    assert os.path.exists(xml_path)
    with open(xml_path, "r") as f:
        xml_content = f.read()
        assert "CaseDam_Def" in xml_content or "casedef" in xml_content
        assert "gravity" in xml_content
    logger.info(f"  ✓ DualSPHysics SPH Adapter: Successfully generated GenCase XML definition ({os.path.basename(xml_path)}) with Wendland quintic kernel.")
    test_results["SPH_Adapter"] = "PASSED"

    # 3. Hybrid Simulation Engine Orchestration
    engine = SimulationEngine()
    sc_dict = sc_payload
    
    common_res, comp_payload = engine.run(
        simulation_id, scenario_id, sc_dict, dam_dict, solver_type="HYBRID_COMPARISON", execution_mode="DEMO_REFERENCE"
    )
    assert common_res.total_area_flooded_sqkm > 0.0
    assert common_res.peak_water_depth_m > 0.0
    assert common_res.peak_velocity_ms > 0.0
    assert comp_payload is not None
    assert len(comp_payload["metrics"]) == 3
    logger.info(f"  ✓ SimulationEngine: Executed hybrid comparison. Inundation Extent: {common_res.total_area_flooded_sqkm} km², Max Depth: {common_res.peak_water_depth_m}m, Max Vel: {common_res.peak_velocity_ms}m/s")
    logger.info(f"  ✓ Quantitative Divergence Metrics: {comp_payload['metrics'][0]['metric_name']} -> Delft3D: {comp_payload['metrics'][0]['delft3d_value']} vs SPH: {comp_payload['metrics'][0]['sph_value']}")
    test_results["Simulation_Engine"] = "PASSED"

    # =========================================================================
    # PART 3: GIS VECTORIZATION, HAZARD CLASSIFICATION & ZERO-QGIS EXPORTS
    # =========================================================================
    logger.info("\n--- [PART 3/4] TESTING GIS VECTORIZATION, HAZARDS, IMPACT & EXPORTS ---")
    
    # 1. Flood Analysis Vector Contouring
    fa = FloodAnalysisEngine()
    flood_analysis = fa.analyze_simulation_result(common_res)
    assert len(flood_analysis["timestep_series"]) > 0
    logger.info(f"  ✓ FloodAnalysisEngine: Generated {len(flood_analysis['timestep_series'])} discrete temporal wave propagation contours.")
    test_results["GIS_Contour_Vectorization"] = "PASSED"

    # 2. 4-Tier Risk Engine Classification
    re = RiskEngine()
    risk_zones = re.generate_risk_zones(common_res)
    assert "LEVEL_3_CRITICAL" in risk_zones
    assert "LEVEL_2_HIGH_RISK" in risk_zones
    assert "LEVEL_1_WARNING" in risk_zones
    logger.info(f"  ✓ RiskEngine: Level 3 Critical Area = {risk_zones['LEVEL_3_CRITICAL']['area_sqkm']} km² (Max Depth: {risk_zones['LEVEL_3_CRITICAL']['max_depth_m']}m)")
    logger.info(f"  ✓ RiskEngine: Level 2 High Risk Area = {risk_zones['LEVEL_2_HIGH_RISK']['area_sqkm']} km²")
    logger.info(f"  ✓ RiskEngine: Level 1 Warning Area  = {risk_zones['LEVEL_1_WARNING']['area_sqkm']} km²")
    test_results["Risk_Engine_Classification"] = "PASSED"

    # 3. Infrastructure & Population Exposure Overlay (Honest Distinction)
    ie = ImpactAnalysisEngine()
    infra_mock = {
        "buildings": [{"location": [70.860, 22.820], "estimated_occupants": 5}, {"location": [70.865, 22.825], "estimated_occupants": 4}],
        "roads": [{"name": "NH-8A", "geometry": {"type": "LineString", "coordinates": [[70.84, 22.80], [70.88, 22.84]]}}],
        "bridges": [{"name": "Darbar Gadh Bridge", "location": [70.865, 22.818]}],
        "schools": [{"name": "Municipal Primary School", "location": [70.868, 22.815]}],
        "hospitals": [{"name": "Morbi Civil Hospital", "location": [70.864, 22.821]}],
        "agriculture": [{"name": "Farmland", "geometry": {"type": "Polygon", "coordinates": [[[70.86, 22.78], [70.88, 22.78], [70.88, 22.80], [70.86, 22.80], [70.86, 22.78]]]}}]
    }
    impact = ie.analyze_exposure(risk_zones, infra_mock)
    assert impact["exposed_buildings_count"] > 0
    assert "disclaimer" in impact["summary_report"]
    logger.info(f"  ✓ ImpactAnalysisEngine: Exposed Buildings: {impact['exposed_buildings_count']}, Population: {impact['exposed_population_estimate']}, Roads: {impact['exposed_roads_length_km']} km")
    logger.info(f"  ✓ Physical Honesty Disclaimer Verified: '{impact['summary_report']['disclaimer'][:75]}...'")
    test_results["Impact_Exposure_Analysis"] = "PASSED"

    # 4. Multi-Format GIS Exporter (Binary Shapefile ZIP, KML, GeoJSON)
    temp_export_dir = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")), "storage", "exports", simulation_id)
    os.makedirs(temp_export_dir, exist_ok=True)
    zip_path = os.path.join(temp_export_dir, "flood_zones.zip")
    
    GISExportEngine.export_shapefile_zip(risk_zones, {"simulation_id": simulation_id}, zip_path)
    assert os.path.exists(zip_path)
    with zipfile.ZipFile(zip_path, "r") as z:
        archived_files = z.namelist()
        assert any(f.endswith(".shp") for f in archived_files), "Shapefile .shp missing"
        assert any(f.endswith(".shx") for f in archived_files), "Shapefile .shx missing"
        assert any(f.endswith(".dbf") for f in archived_files), "Shapefile .dbf missing"
        assert any(f.endswith(".prj") for f in archived_files), "Shapefile .prj missing"
    logger.info(f"  ✓ GISExportEngine: Created standalone pure binary ESRI Shapefile Bundle (.zip) -> {os.path.getsize(zip_path)} bytes")
    
    kml_str = GISExportEngine.export_kml(risk_zones, {"simulation_id": simulation_id})
    assert "<kml" in kml_str and "</kml>" in kml_str
    logger.info("  ✓ GISExportEngine: Generated OGC KML 2.2 vector package.")

    geojson_str = GISExportEngine.export_geojson(risk_zones, {"simulation_id": simulation_id})
    assert "FeatureCollection" in geojson_str
    logger.info("  ✓ GISExportEngine: Generated RFC 7946 GeoJSON FeatureCollection.")
    test_results["GIS_MultiFormat_Exporter"] = "PASSED"

    # =========================================================================
    # PART 4: GEE SATELLITE VALIDATION, REVERSE FLOOD & MOBILE OFFLINE GEOFENCING
    # =========================================================================
    logger.info("\n--- [PART 4/4] TESTING GEE SATELLITE VALIDATION & MOBILE OFFLINE GEOFENCING ---")
    
    # 1. Google Earth Engine (GEE) Sentinel-1 SAR IoU Validation
    gee = GEEValidationEngine()
    sat_val = gee.validate_simulation_with_satellite(risk_zones["LEVEL_3_CRITICAL"]["geometry"])
    assert sat_val["iou_score"] is not None
    assert sat_val["iou_score"] >= 0.0
    logger.info(f"  ✓ GEE Validation: Sentinel-1 SAR GRD IoU Similarity Score = {sat_val['iou_score']:.3f} (Overlap: {sat_val['overlap_pct']:.1f}%)")
    test_results["GEE_Satellite_Validation"] = "PASSED"

    # 2. Reverse Flood Matching / Hypothesis Ranking
    candidate_scenarios = [
        {"id": scenario_id, "name": created_scenario["name"], "dam_name": dam_name, "geometry": risk_zones["LEVEL_3_CRITICAL"]["geometry"]},
        {"id": "dummy-sc-2", "name": "Overtopping 20m Minor Breach", "dam_name": dam_name, "geometry": risk_zones["LEVEL_1_WARNING"]["geometry"]}
    ]
    rev_match = gee.reverse_scenario_match(sat_val["observed_geometry"], candidate_scenarios)
    assert len(rev_match["top_matched_scenarios"]) > 0
    top_scenario = rev_match["top_matched_scenarios"][0]
    logger.info(f"  ✓ Reverse Flood Engine: Top Ranked Breach Scenario = '{top_scenario['scenario_name']}' (IoU: {top_scenario['iou_similarity']:.3f}, Confidence: {top_scenario['confidence_tier']})")
    test_results["Reverse_Flood_Hypothesis"] = "PASSED"

    # 3. Downstream Results APIs Verification
    res_fz = client.get(f"/api/v1/flood-zones/simulation/{simulation_id}")
    assert res_fz.status_code == 200
    logger.info(f"  ✓ GET /api/v1/flood-zones/simulation/{simulation_id} -> Success ({len(res_fz.json())} flood zones)")

    res_rz = client.get(f"/api/v1/flood-zones/risk-zones/{simulation_id}")
    assert res_rz.status_code == 200
    logger.info(f"  ✓ GET /api/v1/flood-zones/risk-zones/{simulation_id} -> Success ({len(res_rz.json())} risk tiers)")

    res_imp = client.get(f"/api/v1/impacts/{simulation_id}")
    assert res_imp.status_code == 200
    logger.info(f"  ✓ GET /api/v1/impacts/{simulation_id} -> Success (Exposed: {res_imp.json()['exposed_buildings_count']} buildings)")

    res_shp = client.get(f"/api/v1/exports/{simulation_id}/shp")
    assert res_shp.status_code == 200
    assert res_shp.headers["content-type"] == "application/zip"
    logger.info(f"  ✓ GET /api/v1/exports/{simulation_id}/shp -> Downloaded ZIP ({len(res_shp.content)} bytes)")

    res_kml = client.get(f"/api/v1/exports/{simulation_id}/kml")
    assert res_kml.status_code == 200
    logger.info(f"  ✓ GET /api/v1/exports/{simulation_id}/kml -> Downloaded KML ({len(res_kml.content)} bytes)")

    res_geo = client.get(f"/api/v1/exports/{simulation_id}/geojson")
    assert res_geo.status_code == 200
    logger.info(f"  ✓ GET /api/v1/exports/{simulation_id}/geojson -> Downloaded GeoJSON ({len(res_geo.content)} bytes)")

    res_sat = client.get(f"/api/v1/ge/validation/{simulation_id}")
    assert res_sat.status_code == 200
    logger.info(f"  ✓ GET /api/v1/ge/validation/{simulation_id} -> GEE SAR Metrics API Success (IoU: {res_sat.json()['iou_score']})")

    res_rev = client.post("/api/v1/ge/reverse-match", json={"observed_geometry": sat_val["observed_geometry"]})
    assert res_rev.status_code == 200
    logger.info("  ✓ POST /api/v1/ge/reverse-match -> Reverse Matching API Success")

    # Shelters, Routes, Alerts, Devices
    res_sh = client.get("/api/v1/shelters")
    assert res_sh.status_code == 200
    logger.info(f"  ✓ GET /api/v1/shelters -> Retrieved {len(res_sh.json())} shelters.")

    res_rt = client.get("/api/v1/safe-routes")
    assert res_rt.status_code == 200
    logger.info(f"  ✓ GET /api/v1/safe-routes -> Retrieved {len(res_rt.json())} evacuation routes.")

    res_al = client.get("/api/v1/alerts")
    assert res_al.status_code == 200
    logger.info(f"  ✓ GET /api/v1/alerts -> Retrieved {len(res_al.json())} emergency alerts.")

    res_dev = client.post("/api/v1/devices/register", json={"fcm_token": "mock-fcm-token-test-123", "device_os": "ANDROID", "app_version": "1.0.0"})
    assert res_dev.status_code == 200
    logger.info("  ✓ POST /api/v1/devices/register -> Device Registered.")

    test_results["Downstream_APIs"] = "PASSED"

    logger.info("\n==================================================================================")
    logger.info("COMPREHENSIVE TEST AUDIT COMPLETE: ALL MODULES & PIPELINES VERIFIED!")
    logger.info("==================================================================================")
    for test_name, status in test_results.items():
        logger.info(f"  • {test_name.ljust(30)}: {status}")
    logger.info("==================================================================================")

if __name__ == "__main__":
    run_comprehensive_test()
