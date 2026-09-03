import os
# Set OpenBLAS / OMP thread limits for Windows stability
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.api.auth import router as auth_router
from backend.app.api.users import router as users_router
from backend.app.api.dams import router as dams_router
from backend.app.api.rivers import router as rivers_router
from backend.app.api.datasets import router as datasets_router
from backend.app.api.scenarios import router as scenarios_router
from backend.app.api.simulations import router as simulations_router
from backend.app.api.flood import router as flood_router
from backend.app.api.impact import router as impact_router
from backend.app.api.gis import router as gis_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.devices import router as devices_router
from backend.app.api.shelters import router as shelters_router
from backend.app.api.ge import router as ge_router
from backend.app.api.health import router as health_router

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("damflood.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Dam Inundation Hydrodynamic Platform API...")
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema verified.")
    yield
    logger.info("Shutting down API server...")

app = FastAPI(
    title="Dam Break Inundation Hydrodynamic Modelling API",
    description="""
# SIH 2026 Problem Statement: Dam Break Inundation Modelling Using Hydrodynamic Modelling of Any River

### Capabilities:
- **Hydrodynamic Solvers:** Multi-solver execution (Delft3D-FM Flexible Mesh, DualSPHysics SPH, Reference Saint-Venant 2D Engine)
- **Multi-Hazard Analysis:** Extent, Depth, Velocity, and Arrival Time Contours
- **Risk Engine:** Discrete Spatial Classifications (Level 0 Safe to Level 3 Critical)
- **Infrastructure Impact:** Exposure Overlay (Buildings, Roads, Bridges, Schools, Hospitals, Population, Agriculture)
- **Automated GIS Export:** Zero-QGIS generation of Shapefiles (.zip with .shp/.shx/.dbf/.prj), KML, and GeoJSON
- **Satellite Validation:** Google Earth Engine Sentinel-1 SAR GRD IoU scoring & Reverse Flood Hypothesis Ranking
- **Citizen Early Warning:** Mobile GPS Geofencing & FCM Emergency Dispatch
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All API Routers under /api/v1
api_prefix = settings.API_V1_PREFIX

app.include_router(auth_router, prefix=api_prefix)
app.include_router(users_router, prefix=api_prefix)
app.include_router(dams_router, prefix=api_prefix)
app.include_router(rivers_router, prefix=api_prefix)
app.include_router(datasets_router, prefix=api_prefix)
app.include_router(scenarios_router, prefix=api_prefix)
app.include_router(simulations_router, prefix=api_prefix)
app.include_router(flood_router, prefix=api_prefix)
app.include_router(impact_router, prefix=api_prefix)
app.include_router(gis_router, prefix=api_prefix)
app.include_router(alerts_router, prefix=api_prefix)
app.include_router(devices_router, prefix=api_prefix)
app.include_router(shelters_router, prefix=api_prefix)
app.include_router(ge_router, prefix=api_prefix)
app.include_router(health_router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "name": "Dam Break Inundation Hydrodynamic Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "api_prefix": settings.API_V1_PREFIX,
        "health": f"{settings.API_V1_PREFIX}/health"
    }
