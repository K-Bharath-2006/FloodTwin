import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base, GeometryJSON
from backend.app.models.flood import RiskLevel

class DeviceOS(str, Enum):
    ANDROID = "ANDROID"
    IOS = "IOS"
    WEB = "WEB"

class DeliveryChannel(str, Enum):
    FCM_PUSH = "FCM_PUSH"
    OFFLINE_GEOFENCE = "OFFLINE_GEOFENCE"
    SMS_GATEWAY = "SMS_GATEWAY"
    BROADCAST_BEACON = "BROADCAST_BEACON"

class Device(Base):
    __tablename__ = "devices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    fcm_token = Column(String(512), unique=True, index=True, nullable=False)
    device_os = Column(SQLEnum(DeviceOS), default=DeviceOS.ANDROID, nullable=False)
    device_model = Column(String(100), nullable=True)
    last_known_location = Column(GeometryJSON, nullable=True) # Point GeoJSON [lon, lat]
    last_known_latitude = Column(Float, nullable=True)
    last_known_longitude = Column(Float, nullable=True)
    is_active = Column(Float, default=1.0)
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    alert_events = relationship("AlertEvent", back_populates="device", cascade="all, delete-orphan")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_id = Column(String(36), ForeignKey("simulations.id"), nullable=False)
    risk_level = Column(SQLEnum(RiskLevel), nullable=False, index=True)
    target_geometry = Column(GeometryJSON, nullable=False) # MultiPolygon GeoJSON
    title = Column(String(255), nullable=False)
    message = Column(String(1024), nullable=False)
    severity = Column(String(50), default="CRITICAL")
    expected_arrival_time_min = Column(Float, nullable=True)
    nearest_shelter_name = Column(String(255), nullable=True)
    cooldown_minutes = Column(Float, default=15.0) # Prevents spamming citizens in same zone
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    simulation = relationship("Simulation", back_populates="alerts")
    alert_events = relationship("AlertEvent", back_populates="alert", cascade="all, delete-orphan")

class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id = Column(String(36), ForeignKey("alerts.id"), nullable=False)
    device_id = Column(String(36), ForeignKey("devices.id"), nullable=True)
    delivered_via = Column(SQLEnum(DeliveryChannel), default=DeliveryChannel.FCM_PUSH, nullable=False)
    delivery_status = Column(String(50), default="DELIVERED") # DELIVERED, OFFLINE_TRIGGERED, FAILED
    delivery_payload = Column(JSON, default=dict)
    received_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    alert = relationship("Alert", back_populates="alert_events")
    device = relationship("Device", back_populates="alert_events")
