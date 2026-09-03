from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.flood import ImpactRecord
from backend.app.schemas.flood import ImpactRecordResponse

router = APIRouter(prefix="/impacts", tags=["Impact & Exposure Analysis"])

@router.get("/{simulation_id}", response_model=ImpactRecordResponse)
def get_simulation_impact_report(simulation_id: str, db: Session = Depends(get_db)):
    """
    Retrieves infrastructure exposure analysis for a completed simulation.
    Strictly reports EXPOSED counts/lengths without claiming physical destruction.
    """
    impact = db.query(ImpactRecord).filter(ImpactRecord.simulation_id == simulation_id).first()
    if not impact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Impact record not found for this simulation.")
    return impact
