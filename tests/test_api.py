import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app
from backend.app.database import SessionLocal, Base, engine
from scripts.setup_demo_data import generate_demo_dataset

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    generate_demo_dataset()

@pytest.fixture
def client():
    return TestClient(app)

def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "solvers" in data
    assert "reference_hydrodynamic_engine" in data["solvers"]

def test_get_dams(client):
    response = client.get("/api/v1/dams")
    assert response.status_code == 200
    dams = response.json()
    assert len(dams) >= 1
    assert dams[0]["name"] == "Machhu-II Dam"
    assert dams[0]["height_m"] == 24.0

def test_get_rivers(client):
    response = client.get("/api/v1/rivers")
    assert response.status_code == 200
    rivers = response.json()
    assert len(rivers) >= 1
    assert rivers[0]["name"] == "Machhu River"

def test_get_scenarios_and_comparison(client):
    response = client.get("/api/v1/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 3

    # Compare endpoint
    cmp_res = client.get("/api/v1/scenarios/compare")
    assert cmp_res.status_code == 200
    cmp_data = cmp_res.json()
    assert len(cmp_data) >= 1

def test_get_simulations_and_results(client):
    response = client.get("/api/v1/simulations")
    assert response.status_code == 200
    sims = response.json()
    assert len(sims) >= 1
    sim_id = sims[0]["id"]

    # Status endpoint
    status_res = client.get(f"/api/v1/simulations/{sim_id}/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "COMPLETED"

    # Comparison endpoint
    cmp_res = client.get(f"/api/v1/simulations/{sim_id}/comparison")
    assert cmp_res.status_code == 200
    cmp_data = cmp_res.json()
    assert "delft3d_extent_sqkm" in cmp_data
    assert "sph_extent_sqkm" in cmp_data

def test_flood_and_risk_zones(client):
    sims = client.get("/api/v1/simulations").json()
    sim_id = sims[0]["id"]

    # Flood zones
    fz_res = client.get(f"/api/v1/flood-zones/simulation/{sim_id}")
    assert fz_res.status_code == 200
    assert len(fz_res.json()) >= 1

    # Risk zones
    rz_res = client.get(f"/api/v1/flood-zones/risk-zones/{sim_id}")
    assert rz_res.status_code == 200
    assert len(rz_res.json()) >= 1

def test_impact_analysis(client):
    sims = client.get("/api/v1/simulations").json()
    sim_id = sims[0]["id"]

    res = client.get(f"/api/v1/impacts/{sim_id}")
    assert res.status_code == 200
    data = res.json()
    assert "exposed_buildings_count" in data
    assert "summary_report" in data
    assert "disclaimer" in data["summary_report"]

def test_gis_exports(client):
    sims = client.get("/api/v1/simulations").json()
    sim_id = sims[0]["id"]

    # GeoJSON export
    res_geojson = client.get(f"/api/v1/exports/{sim_id}/geojson")
    assert res_geojson.status_code == 200
    assert res_geojson.headers["content-type"] == "application/geo+json"
    geojson_data = res_geojson.json()
    assert geojson_data["type"] == "FeatureCollection"

    # KML export
    res_kml = client.get(f"/api/v1/exports/{sim_id}/kml")
    assert res_kml.status_code == 200
    assert "kml" in res_kml.text

    # Shapefile zip export
    res_shp = client.get(f"/api/v1/exports/{sim_id}/shp")
    assert res_shp.status_code == 200
    assert res_shp.headers["content-type"] == "application/zip"

def test_shelters_and_routes(client):
    res_shelters = client.get("/api/v1/shelters")
    assert res_shelters.status_code == 200
    assert len(res_shelters.json()) >= 3

    res_routes = client.get("/api/v1/safe-routes")
    assert res_routes.status_code == 200
    assert len(res_routes.json()) >= 2
