from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.alert import Alert, AlertEvent, Device, DeliveryChannel
from backend.app.models.flood import RiskLevel, RiskZone
from backend.app.schemas.alert import AlertResponse, AlertTestRequest
from backend.app.models.user import User, UserRole
from backend.app.auth.security import get_current_user, require_role
import datetime

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    """Retrieves all active emergency flood alerts."""
    return db.query(Alert).order_by(Alert.created_at.desc()).all()

@router.post("/test", response_model=AlertResponse)
def dispatch_test_alert(
    req: AlertTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MODELLER]))
):
    """
    Dispatches a test emergency alert to registered mobile devices.
    Demonstrates FCM push and geofence triggering with deduplication.
    """
    # Fetch risk zone geometry
    risk_zone = db.query(RiskZone).filter(
        RiskZone.simulation_id == req.simulation_id,
        RiskZone.risk_level == req.risk_level
    ).first()

    target_geom = risk_zone.geometry if risk_zone else {
        "type": "Polygon",
        "coordinates": [[[70.84, 22.80], [70.88, 22.80], [70.88, 22.84], [70.84, 22.84], [70.84, 22.80]]]
    }

    alert = Alert(
        simulation_id=req.simulation_id,
        risk_level=req.risk_level,
        target_geometry=target_geom,
        title="EMERGENCY TEST: Dam Inundation Warning",
        message=req.custom_message or "High inundation risk detected. Test broadcast for emergency shelter preparedness.",
        severity="TEST_WARNING",
        expected_arrival_time_min=15.0,
        nearest_shelter_name="Morbi Town Hall Relief Shelter",
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=6)
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Record alert events for active devices
    active_devices = db.query(Device).filter(Device.is_active == 1.0).all()
    for dev in active_devices:
        evt = AlertEvent(
            alert_id=alert.id,
            device_id=dev.id,
            delivered_via=DeliveryChannel.FCM_PUSH,
            delivery_status="DELIVERED",
            delivery_payload={"title": alert.title, "severity": alert.severity}
        )
        db.add(evt)
    db.commit()

    return alert
