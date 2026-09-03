import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.flood import RiskZone
from backend.app.models.simulation import Simulation, SimulationStatus
from backend.app.config import settings
from gis.exporter import GISExportEngine

router = APIRouter(prefix="/exports", tags=["GIS Exports"])

def get_risk_dict(simulation_id: str, db: Session):
    sim = db.query(Simulation).filter(Simulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found.")
    
    zones = db.query(RiskZone).filter(RiskZone.simulation_id == simulation_id).all()
    if not zones:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No risk zones generated for this simulation.")

    color_map = {
        "LEVEL_3_CRITICAL": "#EF4444",
        "LEVEL_2_HIGH_RISK": "#F97316",
        "LEVEL_1_WARNING": "#EAB308",
        "LEVEL_0_SAFE": "#22C55E"
    }

    risk_dict = {}
    for z in zones:
        lvl_key = z.risk_level.value
        risk_dict[lvl_key] = {
            "risk_level": lvl_key,
            "color": color_map.get(lvl_key, "#EF4444"),
            "area_sqkm": z.area_sqkm,
            "max_depth_m": z.max_depth_m,
            "max_velocity_ms": z.max_velocity_ms,
            "min_arrival_time_min": z.min_arrival_time_min,
            "geometry": z.geometry
        }
    return risk_dict, sim

@router.get("/{simulation_id}/shp")
def export_shapefile_zip(simulation_id: str, db: Session = Depends(get_db)):
    """
    Downloads ESRI Shapefile bundle (.shp, .shx, .dbf, .prj) packaged into flood_zones.zip.
    """
    risk_dict, sim = get_risk_dict(simulation_id, db)
    export_dir = os.path.join(settings.STORAGE_PATH, "exports", simulation_id)
    os.makedirs(export_dir, exist_ok=True)
    zip_path = os.path.join(export_dir, f"flood_zones_{simulation_id[:8]}.zip")

    GISExportEngine.export_shapefile_zip(risk_dict, {"simulation_id": simulation_id}, zip_path)
    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename=f"flood_risk_zones_{simulation_id[:8]}.zip"
    )

@router.get("/{simulation_id}/kml")
def export_kml_file(simulation_id: str, db: Session = Depends(get_db)):
    """
    Downloads standard OGC KML file with styled risk color tiers for Google Earth.
    """
    risk_dict, sim = get_risk_dict(simulation_id, db)
    kml_str = GISExportEngine.export_kml(risk_dict, {"simulation_id": simulation_id})
    return Response(
        content=kml_str,
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": f"attachment; filename=flood_zones_{simulation_id[:8]}.kml"}
    )

@router.get("/{simulation_id}/geojson")
def export_geojson_file(simulation_id: str, db: Session = Depends(get_db)):
    """
    Downloads RFC 7946 compliant GeoJSON FeatureCollection.
    """
    risk_dict, sim = get_risk_dict(simulation_id, db)
    geojson_str = GISExportEngine.export_geojson(risk_dict, {"simulation_id": simulation_id})
    return Response(
        content=geojson_str,
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename=flood_zones_{simulation_id[:8]}.geojson"}
    )
