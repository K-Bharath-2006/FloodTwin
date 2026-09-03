# Dam Break Inundation Modelling & Citizen Early Warning Platform
### Smart India Hackathon (SIH 2026) • Problem Statement Solution

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![PostGIS](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-336791.svg)](https://postgis.net/)
[![React + TypeScript](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20MapLibre-61DAFB.svg)](https://reactjs.org/)
[![React Native Expo](https://img.shields.io/badge/Mobile-React%20Native%20Expo-000020.svg)](https://expo.dev/)
[![Docker](https://img.shields.io/badge/Orchestration-Docker%20Compose-2496ED.svg)](https://www.docker.com/)

---

## 🌊 System Overview

A complete, production-grade disaster management and hydrodynamic modeling system for **dam-break and river-blockage flood simulation, hazard classification, exposure analytics, multi-format GIS export, Google Earth Engine satellite validation, and offline-geofenced citizen mobile alerting**.

### Key Architectural Highlights
1. **Multi-Model Hydrodynamic Simulation:**
   - **Delft3D-FM Flexible Mesh (D-Flow FM):** 2D Shallow Water Equations (SWE) for regional valley inundation.
   - **DualSPHysics (Smoothed Particle Hydrodynamics):** 3D/2D Lagrangian particle momentum solver for near-field violent breach kinematics.
   - **Reference 2D-SWE Engine:** High-performance, zero-dependency calibrated solver for benchmark testing and demo environments without black-box proprietary solver dependency.
   - **Quantitative Model Comparison:** Direct metric divergence calculations (Flooded Extent $\Delta\text{Area}$, Peak Depth $\Delta h_{\max}$, Peak Velocity $\Delta V_{\max}$).
2. **Automated Zero-QGIS Multi-Format GIS Exports:**
   - Standalone binary ESRI Shapefile packager producing `.zip` containing `.shp`, `.shx`, `.dbf`, and `.prj` in WGS84.
   - OGC KML 2.2 files with color-coded altitude extrusion.
   - RFC 7946 GeoJSON FeatureCollections.
3. **Google Earth Engine (GEE) Satellite Validation:**
   - Near-real-time Sentinel-1 SAR C-Band backscatter water observation.
   - Quantitative consistency metrics: **Intersection over Union (IoU / Jaccard Index)**, Overlap %, False Positives, and False Negatives.
   - **Reverse Flood Scenario Matching:** Ranks hypothetical breach scenarios against observed satellite flood polygons.
4. **Citizen Mobile Application with Offline Geofencing:**
   - React Native Expo application with local SQLite cache.
   - **Zero-Connectivity Ray-Casting Geofencing:** Evaluates device GPS coordinates against cached Level 0–3 polygons with zero internet.
   - **Physical Honesty & Stale-Data Detection:** Clearly shows last synchronization timestamp, data age, and warnings if data exceeds freshness thresholds.

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint & middleware
│   │   ├── config.py            # Environment & Pydantic settings
│   │   ├── database.py          # PostGIS / SQLAlchemy engine & SessionLocal
│   │   ├── api/                 # 15 REST API routers
│   │   ├── auth/                # Google OAuth 2.0 & RBAC security
│   │   ├── models/              # PostGIS ORM database models
│   │   ├── schemas/             # Pydantic validation schemas
│   │   └── jobs/                # Background simulation task workers
│   └── requirements.txt         # Backend Python dependencies
├── simulation/
│   ├── common.py                # Standardized CommonSimulationResult format
│   ├── base.py                  # Abstract BaseSimulationAdapter
│   ├── delft3d/                 # Delft3D-FM MDU/BC generator & process runner
│   ├── sph/                     # DualSPHysics GenCase XML runner
│   ├── reference_solver.py      # Calibrated 2D Shallow Water & SPH engine
│   └── engine.py                # Multi-solver orchestrator & comparison engine
├── gis/
│   ├── flood_analysis.py        # Raster-to-polygon vectorization & depth profiles
│   ├── risk_engine.py           # 4-tier hazard classification (Level 0 - Level 3)
│   ├── impact_engine.py         # Infrastructure exposure overlay (Buildings, Roads, etc.)
│   └── exporter.py              # Pure binary Shapefile (.zip), KML, and GeoJSON exporters
├── ge/
│   └── validator.py             # Google Earth Engine Sentinel-1 SAR IoU validation
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, MapViewer (GIS canvas)
│   │   ├── views/               # 15 interactive dashboard views
│   │   ├── services/            # Frontend API client
│   │   ├── types/               # TypeScript data contracts
│   │   └── App.tsx              # Main dashboard application
│   ├── package.json             # Frontend npm dependencies
│   └── vite.config.ts           # Vite build configuration
├── mobile/
│   ├── src/
│   │   ├── screens/             # 10 React Native citizen screens
│   │   ├── services/            # SQLite cache, Ray-Casting geofence, Sync manager
│   │   └── types/               # Mobile TypeScript types
│   ├── App.tsx                  # React Navigation stack & bottom tabs
│   ├── package.json             # Expo mobile dependencies
│   └── test_geofence.js         # Mobile automated geofence test runner
├── scripts/
│   ├── setup_demo_data.py       # Reproducible Indian dam/river dataset generator
│   └── test_e2e_pipeline.py     # 10-step full end-to-end integration test
├── tests/                       # Automated Pytest suite (API, GIS, Solvers)
├── docs/                        # 17 comprehensive technical architecture guides
└── docker-compose.yml           # Multi-container orchestration (PostGIS, Redis, Backend, Frontend)
```

---

## 🚀 Quickstart & Setup Commands

### 1. Backend & Sample Data Setup
```bash
# Install backend dependencies
python -m pip install -r backend/requirements.txt

# Seed reproducible Machhu-II Dam & downstream Morbi hydrodynamic dataset
python scripts/setup_demo_data.py

# Start FastAPI server on port 8000
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: **http://localhost:8000/docs**

### 2. Frontend Web Dashboard Setup
```bash
cd frontend
npm install
npm run dev
```
Web Dashboard will be live at: **http://localhost:5173**

### 3. Citizen Mobile Application Setup
```bash
cd mobile
npm install
npx expo start
```

---

## 🧪 Testing & Verification

Run all test suites across backend, scientific adapters, GIS export, and mobile geofencing:

```bash
# Run backend & GIS test suites
pytest tests/ -v

# Run mobile offline Point-in-Polygon geofence test
node mobile/test_geofence.js

# Run full 10-stage end-to-end pipeline test
python scripts/test_e2e_pipeline.py
```

---

## 📋 Operational Distinction Matrix

| Feature | Production Mode (Real Solver) | Demo / Reference Mode |
|---|---|---|
| **Delft3D-FM Solver** | Calls native `dflowfm` executable with generated `.mdu` & `.bc` | Executes calibrated 2D Saint-Venant Shallow Water Equations |
| **DualSPHysics SPH** | Calls native `GenCase` and `DualSPHysics` binaries with `.xml` | Executes SPH particle momentum kinematic wave solver |
| **GEE Validation** | Authenticates against GEE project via Service Account | Evaluates Sentinel-1 SAR reference radar backscatter baseline |
| **FCM Push** | Dispatches APNs / FCM push payload to device token | Records local delivery event with offline point-in-polygon trigger |
| **Provenance Label** | `REAL SIMULATION` | `DEMO / REFERENCE RESULT` |

---

## 📜 Documentation Index
Complete technical documentation is located in the [`docs/`](./docs) folder:
- [System Architecture](./docs/ARCHITECTURE.md)
- [PostGIS Database & Schema](./docs/DATABASE.md)
- [Hydrodynamic Simulation Principles](./docs/SIMULATION.md)
- [Delft3D-FM Setup & Configuration](./docs/DELFT3D_SETUP.md)
- [DualSPHysics SPH Setup](./docs/SPH_SETUP.md)
- [GIS Pipeline & Shapefile Specifications](./docs/GIS.md)
- [Google Earth Engine Setup](./docs/GEE_SETUP.md)
- [Authentication & RBAC Matrix](./docs/AUTH.md)
- [Mobile Architecture & SQLite Cache](./docs/MOBILE.md)
- [Push Notifications & Alert Deduplication](./docs/NOTIFICATIONS.md)
- [Offline Geofencing & Data Stale Detection](./docs/OFFLINE_MODE.md)
- [Production Deployment Guide](./docs/DEPLOYMENT.md)
- [Open Data Sources](./docs/DATA_SOURCES.md)
- [Security & Threat Model](./docs/SECURITY.md)
- [Testing Guide](./docs/TESTING.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
