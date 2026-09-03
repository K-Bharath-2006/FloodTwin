from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.flood import FloodZone, RiskZone, RiskLevel
from backend.app.schemas.flood import FloodZoneResponse, RiskZoneResponse

router = APIRouter(prefix="/flood-zones", tags=["Flood & Risk Zones"])

@router.get("/simulation/{simulation_id}", response_model=List[FloodZoneResponse])
def get_simulation_flood_zones(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves all time-step flood polygons for a simulation."""
    zones = db.query(FloodZone).filter(FloodZone.simulation_id == simulation_id).order_by(FloodZone.time_step_min.asc()).all()
    return zones

@router.get("/risk-zones/{simulation_id}", response_model=List[RiskZoneResponse])
def get_simulation_risk_zones(simulation_id: str, db: Session = Depends(get_db)):
    """Retrieves classified Level 0, Level 1, Level 2, Level 3 risk zone polygons."""
    zones = db.query(RiskZone).filter(RiskZone.simulation_id == simulation_id).all()
    return zones

@router.get("/{zone_id}", response_model=FloodZoneResponse)
def get_single_flood_zone(zone_id: str, db: Session = Depends(get_db)):
    """Retrieves a single flood zone geometry."""
    zone = db.query(FloodZone).filter(FloodZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flood zone not found.")
    return zone
