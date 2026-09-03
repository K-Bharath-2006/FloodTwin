import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base, GeometryJSON

class Dam(Base):
    __tablename__ = "dams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    river_id = Column(String(36), ForeignKey("rivers.id"), nullable=False)
    location = Column(GeometryJSON, nullable=False) # Point GeoJSON [lon, lat]
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    height_m = Column(Float, nullable=False)
    crest_length_m = Column(Float, nullable=False)
    capacity_mcm = Column(Float, nullable=False) # Million Cubic Meters
    full_reservoir_level_m = Column(Float, nullable=False)
    current_water_level_m = Column(Float, nullable=False)
    spillway_capacity_cumec = Column(Float, default=1000.0) # m3/s
    dam_type = Column(String(100), default="Gravity Dam") # Gravity, Earthen, Arch, Composite
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    reservoir_geometry = Column(GeometryJSON, nullable=True) # Polygon GeoJSON
    properties = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    river = relationship("River", back_populates="dams")
    scenarios = relationship("Scenario", back_populates="dam", cascade="all, delete-orphan")
