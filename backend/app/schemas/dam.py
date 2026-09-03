from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class DamBase(BaseModel):
    name: str = Field(..., example="Machhu-II Dam")
    river_id: str
    latitude: float = Field(..., ge=-90, le=90, example=22.7667)
    longitude: float = Field(..., ge=-180, le=180, example=70.8833)
    height_m: float = Field(..., gt=0, example=24.0)
    crest_length_m: float = Field(..., gt=0, example=1200.0)
    capacity_mcm: float = Field(..., gt=0, example=110.0)
    full_reservoir_level_m: float = Field(..., gt=0, example=57.0)
    current_water_level_m: float = Field(..., gt=0, example=56.5)
    spillway_capacity_cumec: float = Field(default=1000.0, gt=0, example=5700.0)
    dam_type: str = Field(default="Earthen Dam with Masonry Spillway")
    state: str = Field(..., example="Gujarat")
    district: str = Field(..., example="Morbi")
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)

class DamCreate(DamBase):
    pass

class DamUpdate(BaseModel):
    name: Optional[str] = None
    current_water_level_m: Optional[float] = None
    spillway_capacity_cumec: Optional[float] = None
    properties: Optional[Dict[str, Any]] = None

class DamResponse(DamBase):
    id: str
    location: Dict[str, Any]
    reservoir_geometry: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
