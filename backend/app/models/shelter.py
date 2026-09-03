import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, JSON
from backend.app.database import Base, GeometryJSON

class ShelterStatus(str, Enum):
    OPERATIONAL = "OPERATIONAL"
    NEAR_CAPACITY = "NEAR_CAPACITY"
    FULL = "FULL"
    CLOSED = "CLOSED"

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    location = Column(GeometryJSON, nullable=False) # Point GeoJSON [lon, lat]
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, default=150.0)
    capacity = Column(Float, default=500)
    current_occupancy = Column(Float, default=0)
    status = Column(SQLEnum(ShelterStatus), default=ShelterStatus.OPERATIONAL, nullable=False)
    contact_phone = Column(String(50), nullable=True)
    address = Column(String(512), nullable=True)
    facilities = Column(JSON, default=lambda: ["Drinking Water", "Medical First Aid", "Backup Power", "Food Supplies"])
    is_active = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class EvacuationRoute(Base):
    __tablename__ = "evacuation_routes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    origin_area = Column(String(255), nullable=False)
    destination_shelter_id = Column(String(36), nullable=True)
    geometry = Column(GeometryJSON, nullable=False) # LineString GeoJSON
    length_km = Column(Float, default=0.0)
    safe_risk_level_capacity = Column(String(50), default="Avoids Level 2 and Level 3 Zones")
    road_type = Column(String(100), default="High Elevation Paved Arterial")
    status_note = Column(String(512), default="Suggested route — verify local emergency instructions.")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
