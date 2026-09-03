from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.shelter import Shelter, EvacuationRoute
from backend.app.schemas.shelter import ShelterResponse, EvacuationRouteResponse

router = APIRouter(tags=["Shelters & Evacuation Routes"])

@router.get("/shelters", response_model=List[ShelterResponse])
def get_shelters(db: Session = Depends(get_db)):
    """Retrieves designated relief shelters and occupancy information."""
    return db.query(Shelter).filter(Shelter.is_active == 1.0).all()

@router.get("/safe-routes", response_model=List[EvacuationRouteResponse])
def get_safe_routes(db: Session = Depends(get_db)):
    """
    Retrieves safe evacuation corridors that avoid high-risk hydrodynamic flood zones.
    Disclaimer: Suggested route — verify local emergency instructions.
    """
    return db.query(EvacuationRoute).all()
