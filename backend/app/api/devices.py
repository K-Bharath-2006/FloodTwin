import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.alert import Device
from backend.app.schemas.alert import DeviceRegisterRequest, DeviceResponse
from backend.app.models.user import User
from backend.app.auth.security import get_current_user

router = APIRouter(prefix="/devices", tags=["Mobile Devices"])

@router.post("/register", response_model=DeviceResponse)
def register_device(
    req: DeviceRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registers or updates a mobile device with FCM push token and initial location.
    Privacy-preserving: stores coordinates only for geofence risk evaluation.
    """
    device = db.query(Device).filter(Device.fcm_token == req.fcm_token).first()
    loc_dict = None
    if req.latitude is not None and req.longitude is not None:
        loc_dict = {"type": "Point", "coordinates": [req.longitude, req.latitude]}

    if not device:
        device = Device(
            fcm_token=req.fcm_token,
            device_os=req.device_os,
            device_model=req.device_model,
            last_known_location=loc_dict,
            last_known_latitude=req.latitude,
            last_known_longitude=req.longitude,
            is_active=1.0,
            last_synced_at=datetime.datetime.utcnow()
        )
        db.add(device)
    else:
        device.device_os = req.device_os
        device.device_model = req.device_model or device.device_model
        if loc_dict:
            device.last_known_location = loc_dict
            device.last_known_latitude = req.latitude
            device.last_known_longitude = req.longitude
        device.is_active = 1.0
        device.last_synced_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(device)
    return device

@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def unregister_device(device_id: str, db: Session = Depends(get_db)):
    """Deactivates a device registration on logout."""
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        device.is_active = 0.0
        db.commit()
    return None
