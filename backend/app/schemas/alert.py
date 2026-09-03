from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.alert import DeviceOS, DeliveryChannel
from backend.app.models.flood import RiskLevel

class DeviceRegisterRequest(BaseModel):
    fcm_token: str
    device_os: DeviceOS = Field(default=DeviceOS.ANDROID)
    device_model: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DeviceResponse(BaseModel):
    id: str
    device_os: DeviceOS
    device_model: Optional[str] = None
    is_active: float
    last_synced_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertTestRequest(BaseModel):
    simulation_id: str
    risk_level: RiskLevel = Field(default=RiskLevel.LEVEL_3_CRITICAL)
    custom_message: Optional[str] = None

class AlertResponse(BaseModel):
    id: str
    simulation_id: str
    risk_level: RiskLevel
    target_geometry: Dict[str, Any]
    title: str
    message: str
    severity: str
    expected_arrival_time_min: Optional[float] = None
    nearest_shelter_name: Optional[str] = None
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
