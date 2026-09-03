from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.dam import Dam
from backend.app.schemas.dam import DamResponse, DamCreate, DamUpdate
from backend.app.models.user import User, UserRole
from backend.app.auth.security import get_current_user, require_role

router = APIRouter(prefix="/dams", tags=["Dams"])

@router.get("", response_model=List[DamResponse])
def get_dams(db: Session = Depends(get_db)):
    """Lists all registered Indian dams."""
    return db.query(Dam).all()

@router.get("/{dam_id}", response_model=DamResponse)
def get_dam(dam_id: str, db: Session = Depends(get_db)):
    """Retrieves single dam details and reservoir properties."""
    dam = db.query(Dam).filter(Dam.id == dam_id).first()
    if not dam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dam not found.")
    return dam

@router.post("", response_model=DamResponse, status_code=status.HTTP_201_CREATED)
def create_dam(
    dam_in: DamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MODELLER]))
):
    """Registers a new dam for hydrodynamic analysis."""
    dam = Dam(
        name=dam_in.name,
        river_id=dam_in.river_id,
        location={"type": "Point", "coordinates": [dam_in.longitude, dam_in.latitude]},
        latitude=dam_in.latitude,
        longitude=dam_in.longitude,
        height_m=dam_in.height_m,
        crest_length_m=dam_in.crest_length_m,
        capacity_mcm=dam_in.capacity_mcm,
        full_reservoir_level_m=dam_in.full_reservoir_level_m,
        current_water_level_m=dam_in.current_water_level_m,
        spillway_capacity_cumec=dam_in.spillway_capacity_cumec,
        dam_type=dam_in.dam_type,
        state=dam_in.state,
        district=dam_in.district,
        properties=dam_in.properties or {}
    )
    db.add(dam)
    db.commit()
    db.refresh(dam)
    return dam
