import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base, GeometryJSON

class River(Base):
    __tablename__ = "rivers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    basin = Column(String(255), nullable=False, index=True)
    geometry = Column(GeometryJSON, nullable=False) # LineString / MultiLineString GeoJSON
    average_slope = Column(Float, default=0.001)
    manning_n = Column(Float, default=0.035) # Roughness coefficient
    length_km = Column(Float, nullable=True)
    properties = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    dams = relationship("Dam", back_populates="river", cascade="all, delete-orphan")
