import os
import sys
import zipfile
import json
import pytest
from shapely.geometry import shape

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from simulation.reference_solver import ReferenceHydrodynamicSolver
from gis.flood_analysis import FloodAnalysisEngine
from gis.risk_engine import RiskEngine
from gis.impact_engine import ImpactAnalysisEngine
from gis.exporter import GISExportEngine

@pytest.fixture
def sample_hydro_result():
    solver = ReferenceHydrodynamicSolver(nx=30, ny=25, dx=30.0, dy=30.0)
    sc = {"breach_width_m": 50.0, "breach_depth_m": 15.0, "reservoir_water_level_m": 25.0, "breach_formation_time_hr": 1.0, "simulation_duration_hr": 1.0}
    dam = {"latitude": 22.76, "longitude": 70.88, "capacity_mcm": 110.0, "manning_n": 0.035}
    return solver.solve("sc-test", "sim-test", sc, dam)

def test_flood_analysis_vectorization(sample_hydro_result):
    engine = FloodAnalysisEngine()
    analysis = engine.analyze_simulation_result(sample_hydro_result)
    assert "max_flood_extent" in analysis
    assert analysis["max_flood_area_sqkm"] > 0
    assert len(analysis["timestep_series"]) > 0

def test_risk_classification(sample_hydro_result):
    risk_engine = RiskEngine()
    risk_dict = risk_engine.generate_risk_zones(sample_hydro_result)
    assert "LEVEL_3_CRITICAL" in risk_dict
    assert "LEVEL_2_HIGH_RISK" in risk_dict
    assert "LEVEL_1_WARNING" in risk_dict

def test_impact_analysis(sample_hydro_result):
    risk_engine = RiskEngine()
    risk_dict = risk_engine.generate_risk_zones(sample_hydro_result)
    
    infra = {
        "buildings": [{"location": [70.86, 22.78], "estimated_occupants": 5}],
        "roads": [{"name": "Test Road", "geometry": {"type": "LineString", "coordinates": [[70.85, 22.76], [70.88, 22.80]]}}],
        "bridges": [],
        "schools": [],
        "hospitals": [],
        "agriculture": []
    }
    impact_engine = ImpactAnalysisEngine()
    impact = impact_engine.analyze_exposure(risk_dict, infra)
    assert "exposed_buildings_count" in impact
    assert "summary_report" in impact
    assert "disclaimer" in impact["summary_report"]

def test_gis_export_packaging(sample_hydro_result, tmp_path):
    risk_engine = RiskEngine()
    risk_dict = risk_engine.generate_risk_zones(sample_hydro_result)
    sim_meta = {"simulation_id": "test-sim-export"}

    # 1. GeoJSON
    geojson_str = GISExportEngine.export_geojson(risk_dict, sim_meta)
    geojson_obj = json.loads(geojson_str)
    assert geojson_obj["type"] == "FeatureCollection"

    # 2. KML
    kml_str = GISExportEngine.export_kml(risk_dict, sim_meta)
    assert "<kml" in kml_str

    # 3. Shapefile zip bundle
    zip_path = os.path.join(tmp_path, "flood_zones.zip")
    out_path = GISExportEngine.export_shapefile_zip(risk_dict, sim_meta, zip_path)
    assert os.path.exists(out_path)
    with zipfile.ZipFile(out_path, "r") as z:
        namelist = z.namelist()
        assert any(f.endswith(".shp") for f in namelist)
        assert any(f.endswith(".shx") for f in namelist)
        assert any(f.endswith(".dbf") for f in namelist)
        assert any(f.endswith(".prj") for f in namelist)
