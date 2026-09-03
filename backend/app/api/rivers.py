from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.river import River
from backend.app.schemas.river import RiverResponse, RiverCreate
from backend.app.models.user import User, UserRole
from backend.app.auth.security import get_current_user, require_role

router = APIRouter(prefix="/rivers", tags=["Rivers"])

@router.get("", response_model=List[RiverResponse])
def get_rivers(db: Session = Depends(get_db)):
    """Lists all river networks and geometries."""
    return db.query(River).all()

@router.get("/{river_id}", response_model=RiverResponse)
def get_river(river_id: str, db: Session = Depends(get_db)):
    """Retrieves single river profile, slope, and roughness."""
    river = db.query(River).filter(River.id == river_id).first()
    if not river:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="River not found.")
    return river

@router.post("", response_model=RiverResponse, status_code=status.HTTP_201_CREATED)
def create_river(
    river_in: RiverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MODELLER]))
):
    """Registers a new river reach."""
    river = River(
        name=river_in.name,
        basin=river_in.basin,
        geometry=river_in.geometry,
        average_slope=river_in.average_slope,
        manning_n=river_in.manning_n,
        length_km=river_in.length_km,
        properties=river_in.properties or {}
    )
    db.add(river)
    db.commit()
    db.refresh(river)
    return river
