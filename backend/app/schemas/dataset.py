from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.dataset import DatasetType

class DatasetCreate(BaseModel):
    name: str
    dataset_type: DatasetType
    crs: Optional[str] = "EPSG:4326"
    source_attribution: Optional[str] = "OpenTopo / SRTM 30m / OpenStreetMap"
    license: Optional[str] = "CC-BY-4.0"
    metadata_json: Optional[Dict[str, Any]] = Field(default_factory=dict)

class DatasetResponse(BaseModel):
    id: str
    name: str
    dataset_type: DatasetType
    file_path: str
    file_format: str
    file_size_bytes: float
    crs: str
    spatial_bounds: Optional[Dict[str, Any]] = None
    resolution_m: Optional[float] = None
    feature_count: Optional[float] = 0
    source_attribution: Optional[str] = None
    license: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    is_valid: float = 1.0
    created_at: datetime

    class Config:
        from_attributes = True
