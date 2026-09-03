from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.simulation import Simulation, SimulationStatus
from backend.app.models.flood import RiskZone, RiskLevel
from backend.app.models.scenario import Scenario
from backend.app.schemas.satellite import SatelliteValidationResponse, ReverseFloodMatchResponse
from ge.validator import GEEValidationEngine

router = APIRouter(prefix="/ge", tags=["Google Earth Engine & Satellite Validation"])

@router.get("/validation/{simulation_id}", response_model=SatelliteValidationResponse)
def validate_simulation_with_satellite(simulation_id: str, db: Session = Depends(get_db)):
    """
    Performs near-real-time satellite-based flood extent validation (Sentinel-1 SAR / Sentinel-2 MSI).
    Calculates quantitative metrics: IoU similarity, Overlap %, False Positives / Negatives.
    """
    sim = db.query(Simulation).filter(Simulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found.")

    risk_zones = db.query(RiskZone).filter(RiskZone.simulation_id == simulation_id).all()
    # Find combined flood geom
    flood_geom = None
    for rz in risk_zones:
        if rz.geometry:
            flood_geom = rz.geometry
            break

    if not flood_geom:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No flood zones available for satellite validation.")

    engine = GEEValidationEngine()
    val_data = engine.validate_simulation_with_satellite(flood_geom)

    return {
        "id": f"SAT-VAL-{simulation_id[:8]}",
        "simulation_id": simulation_id,
        "platform": val_data["platform"],
        "acquisition_time": val_data["acquisition_time"],
        "product_id": val_data["product_id"],
        "observed_area_sqkm": val_data["observed_area_sqkm"],
        "iou_score": val_data["iou_score"],
        "overlap_area_sqkm": val_data["overlap_area_sqkm"],
        "false_positive_area_sqkm": val_data["false_positive_area_sqkm"],
        "false_negative_area_sqkm": val_data["false_negative_area_sqkm"],
        "validation_status": val_data["validation_status"],
        "validation_report": val_data["validation_report"],
        "created_at": sim.created_at
    }

@router.post("/reverse-match", response_model=ReverseFloodMatchResponse)
def reverse_flood_scenario_matching(db: Session = Depends(get_db)):
    """
    Reverse Flood Analysis / Hypothesis Ranking:
    Compares an observed satellite flood polygon against the library of hydrodynamic scenarios.
    """
    # Sample observed satellite polygon over Morbi
    sample_obs_geom = {
        "type": "Polygon",
        "coordinates": [[[70.85, 22.79], [70.89, 22.79], [70.89, 22.84], [70.85, 22.84], [70.85, 22.79]]]
    }

    scenarios = db.query(Scenario).all()
    candidate_list = []
    for sc in scenarios:
        # Check if completed simulation exists
        sim = db.query(Simulation).filter(Simulation.scenario_id == sc.id, Simulation.status == SimulationStatus.COMPLETED).first()
        rz = db.query(RiskZone).filter(RiskZone.simulation_id == sim.id).first() if sim else None
        if rz and rz.geometry:
            candidate_list.append({
                "id": sc.id,
                "name": sc.name,
                "dam_name": "Machhu-II Dam",
                "geometry": rz.geometry
            })

    engine = GEEValidationEngine()
    return engine.reverse_scenario_match(sample_obs_geom, candidate_list)
