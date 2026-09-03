import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base, GeometryJSON

class RiskLevel(str, Enum):
    LEVEL_0_SAFE = "LEVEL_0_SAFE" # Green
    LEVEL_1_WARNING = "LEVEL_1_WARNING" # Yellow
    LEVEL_2_HIGH_RISK = "LEVEL_2_HIGH_RISK" # Orange
    LEVEL_3_CRITICAL = "LEVEL_3_CRITICAL" # Red

class FloodZone(Base):
    __tablename__ = "flood_zones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_id = Column(String(36), ForeignKey("simulations.id"), nullable=False, index=True)
    time_step_min = Column(Float, default=0.0) # Minute from breach
    geometry = Column(GeometryJSON, nullable=False) # MultiPolygon GeoJSON (WGS84)
    depth_min_m = Column(Float, default=0.0)
    depth_max_m = Column(Float, default=0.0)
    avg_velocity_ms = Column(Float, default=0.0)
    area_sqkm = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    simulation = relationship("Simulation", back_populates="flood_zones")

class RiskZone(Base):
    __tablename__ = "risk_zones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_id = Column(String(36), ForeignKey("simulations.id"), nullable=False, index=True)
    risk_level = Column(SQLEnum(RiskLevel), nullable=False, index=True)
    geometry = Column(GeometryJSON, nullable=False) # MultiPolygon GeoJSON (WGS84)
    min_arrival_time_min = Column(Float, default=0.0)
    max_depth_m = Column(Float, default=0.0)
    max_velocity_ms = Column(Float, default=0.0)
    area_sqkm = Column(Float, default=0.0)
    polygon_count = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    simulation = relationship("Simulation", back_populates="risk_zones")

class ImpactRecord(Base):
    __tablename__ = "impact_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_id = Column(String(36), ForeignKey("simulations.id"), unique=True, nullable=False)

    # Exposed Elements (Strictly labeled as EXPOSURE, not guaranteed destruction)
    exposed_buildings_count = Column(Float, default=0)
    exposed_roads_length_km = Column(Float, default=0.0)
    exposed_bridges_count = Column(Float, default=0)
    exposed_schools_count = Column(Float, default=0)
    exposed_hospitals_count = Column(Float, default=0)
    exposed_population_estimate = Column(Float, default=0)
    exposed_agriculture_sqkm = Column(Float, default=0.0)

    critical_facilities_list = Column(JSON, default=list) # [{name, type, depth_m, arrival_time_min, lat, lon}]
    exposure_by_risk_level = Column(JSON, default=dict) # Breakdowns for Level 1, Level 2, Level 3
    summary_report = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    simulation = relationship("Simulation", back_populates="impact_record")
