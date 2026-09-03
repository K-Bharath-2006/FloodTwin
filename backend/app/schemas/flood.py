from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from backend.app.models.flood import RiskLevel

class FloodZoneResponse(BaseModel):
    id: str
    simulation_id: str
    time_step_min: float
    geometry: Dict[str, Any] # GeoJSON MultiPolygon
    depth_min_m: float
    depth_max_m: float
    avg_velocity_ms: float
    area_sqkm: float
    created_at: datetime

    class Config:
        from_attributes = True

class RiskZoneResponse(BaseModel):
    id: str
    simulation_id: str
    risk_level: RiskLevel
    geometry: Dict[str, Any] # GeoJSON MultiPolygon
    min_arrival_time_min: float
    max_depth_m: float
    max_velocity_ms: float
    area_sqkm: float
    polygon_count: float
    created_at: datetime

    class Config:
        from_attributes = True

class ImpactRecordResponse(BaseModel):
    id: str
    simulation_id: str
    exposed_buildings_count: float
    exposed_roads_length_km: float
    exposed_bridges_count: float
    exposed_schools_count: float
    exposed_hospitals_count: float
    exposed_population_estimate: float
    exposed_agriculture_sqkm: float
    critical_facilities_list: List[Dict[str, Any]]
    exposure_by_risk_level: Dict[str, Any]
    summary_report: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
