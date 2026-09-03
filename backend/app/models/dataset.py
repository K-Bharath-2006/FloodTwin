import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum, JSON
from backend.app.database import Base, GeometryJSON

class DatasetType(str, Enum):
    DEM = "DEM"
    RIVER_GEOMETRY = "RIVER_GEOMETRY"
    DAM_INFRASTRUCTURE = "DAM_INFRASTRUCTURE"
    LAND_USE = "LAND_USE"
    BUILDINGS = "BUILDINGS"
    ROADS = "ROADS"
    BRIDGES = "BRIDGES"
    SCHOOLS = "SCHOOLS"
    HOSPITALS = "HOSPITALS"
    POPULATION = "POPULATION"
    SHELTERS = "SHELTERS"
    SATELLITE_IMAGERY = "SATELLITE_IMAGERY"

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    dataset_type = Column(SQLEnum(DatasetType), nullable=False, index=True)
    file_path = Column(String(512), nullable=False)
    file_format = Column(String(50), nullable=False) # TIF, GEOJSON, SHP, CSV
    file_size_bytes = Column(Float, nullable=False)
    crs = Column(String(50), default="EPSG:4326")
    spatial_bounds = Column(GeometryJSON, nullable=True) # Polygon bbox
    resolution_m = Column(Float, nullable=True) # Grid cell resolution in meters for rasters
    nodata_value = Column(Float, nullable=True)
    feature_count = Column(Float, default=0)
    source_attribution = Column(String(512), nullable=True)
    license = Column(String(255), default="Open Data / CC-BY-4.0")
    metadata_json = Column(JSON, default=dict)
    is_valid = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
