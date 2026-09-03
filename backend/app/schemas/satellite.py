from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from backend.app.models.satellite import SatellitePlatform

class SatelliteValidationResponse(BaseModel):
    id: str
    simulation_id: Optional[str] = None
    platform: SatellitePlatform
    acquisition_time: datetime
    product_id: Optional[str] = None
    observed_area_sqkm: float
    iou_score: Optional[float] = None
    overlap_area_sqkm: Optional[float] = None
    false_positive_area_sqkm: Optional[float] = None
    false_negative_area_sqkm: Optional[float] = None
    validation_status: str
    validation_report: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class ReverseScenarioMatchItem(BaseModel):
    scenario_id: str
    scenario_name: str
    dam_name: str
    iou_similarity: float
    area_difference_sqkm: float
    confidence_tier: str
    notes: str

class ReverseFloodMatchResponse(BaseModel):
    observed_satellite_area_sqkm: float
    platform_source: str
    top_matched_scenarios: List[ReverseScenarioMatchItem]
    disclaimer: str = "Hypothesis ranking based on spatial IoU overlap. Not definitive forensic attribution."
