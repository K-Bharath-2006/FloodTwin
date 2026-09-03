from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.shelter import ShelterStatus

class ShelterBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    elevation_m: float = 150.0
    capacity: float = 500
    current_occupancy: float = 0
    status: ShelterStatus = ShelterStatus.OPERATIONAL
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    facilities: List[str] = Field(default_factory=lambda: ["Drinking Water", "First Aid", "Backup Power", "Food"])

class ShelterResponse(ShelterBase):
    id: str
    location: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class EvacuationRouteResponse(BaseModel):
    id: str
    name: str
    origin_area: str
    destination_shelter_id: Optional[str] = None
    geometry: Dict[str, Any] # GeoJSON LineString
    length_km: float
    safe_risk_level_capacity: str
    road_type: str
    status_note: str
    created_at: datetime

    class Config:
        from_attributes = True
