from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class RiverBase(BaseModel):
    name: str = Field(..., example="Machhu River")
    basin: str = Field(..., example="Saurashtra Basin")
    average_slope: float = Field(default=0.001, gt=0, example=0.0012)
    manning_n: float = Field(default=0.035, gt=0, le=0.2, example=0.035)
    length_km: Optional[float] = Field(default=130.0)
    geometry: Dict[str, Any] # GeoJSON LineString
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)

class RiverCreate(RiverBase):
    pass

class RiverResponse(RiverBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
