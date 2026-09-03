import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base, GeometryJSON

class SatellitePlatform(str, Enum):
    SENTINEL_1_SAR = "SENTINEL_1_SAR"
    SENTINEL_2_MSI = "SENTINEL_2_MSI"
    LANDSAT_8_9 = "LANDSAT_8_9"
    PLANETSCOPE = "PLANETSCOPE"

class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_id = Column(String(36), ForeignKey("simulations.id"), nullable=True, index=True)
    platform = Column(SQLEnum(SatellitePlatform), default=SatellitePlatform.SENTINEL_1_SAR, nullable=False)
    acquisition_time = Column(DateTime, nullable=False)
    product_id = Column(String(255), nullable=True)
    observed_flood_extent = Column(GeometryJSON, nullable=False) # MultiPolygon GeoJSON
    observed_area_sqkm = Column(Float, default=0.0)

    # Validation Metrics (IoU / Area diff against hydrodynamic simulation)
    iou_score = Column(Float, nullable=True) # Intersection over Union (0.0 to 1.0)
    overlap_area_sqkm = Column(Float, nullable=True)
    false_positive_area_sqkm = Column(Float, nullable=True) # Model predicted flood but satellite did not observe
    false_negative_area_sqkm = Column(Float, nullable=True) # Satellite observed water but model did not predict
    validation_status = Column(String(50), default="VALIDATED")
    validation_report = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    simulation = relationship("Simulation", back_populates="satellite_observations")
