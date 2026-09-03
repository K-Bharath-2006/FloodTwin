# System Architecture & Technical Design

## Multi-Tier Architecture Overview

The platform uses a decoupled, asynchronous multi-tier architecture to separate user interaction, computational hydrodynamics, spatial analytics, satellite validation, and mobile early warning.

```
                          ┌────────────────────────┐
                          │     Web Dashboard      │
                          │   React + TypeScript   │
                          └───────────┬────────────┘
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │    FastAPI Backend     │
                          └───────────┬────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
   PostgreSQL / PostGIS             Redis                 Object Storage
   Spatial Geometries & RTree   Task Broker & Cache     Exports (.zip, .kml, .json)
            │                         │
            │                         ▼
            │               Background Job Worker
            │                         │
            │              ┌──────────┴──────────┐
            │              ▼                     ▼
            │         Delft3D-FM            DualSPHysics
            │       2D Flexible Mesh       Smoothed Particles
            │
            ▼
   GIS & Hazard Engine
            │
            ├─────────────────────────┐
            ▼                         ▼
   GEE Satellite Engine     Mobile Alert Engine
   (Sentinel-1 SAR IoU)      (FCM Push & Geofence)
                                      │
                                      ▼
                            React Native Mobile
                                      │
                           ┌──────────┴──────────┐
                           ▼                     ▼
                   Online FCM Push       Offline Point-in-Polygon
                    Notifications          Local SQLite Cache
```

---

## Component Separation Principles

1. **Non-Blocking API Architecture:**
   - Hydrodynamic simulations are never executed synchronously within FastAPI request workers.
   - Calling `POST /api/v1/simulations` creates an immediate record with status `QUEUED` and dispatches the task to the background worker pool.
   - Frontend and mobile clients poll lightweight status endpoints (`GET /simulations/{id}/status`) to observe stage transitions in real time.

2. **Isolated Workspace Directories:**
   - Each simulation run is assigned an isolated workspace:
     ```
     simulation_runs/{simulation_id}/
       ├── input/         # Generated .mdu, .bc, .xml, .xyz files
       ├── delft3d/       # Delft3D process artifacts
       ├── sph/           # DualSPHysics particle outputs
       ├── output/        # Raw netCDF / VTK / CSV outputs
       ├── logs/          # Stdout and Stderr logs
       └── gis/           # Normalized CommonSimulationResult JSON & GeoJSON
     ```
   - Prevents race conditions and cross-simulation file contamination.

3. **Standardized Normalization Layer (`CommonSimulationResult`):**
   - Delft3D-FM, DualSPHysics, and the Reference 2D Solver all convert their discrete output grids into `CommonSimulationResult`.
   - Downstream GIS vectorization, hazard classification, impact assessment, and export packagers operate exclusively on this unified format, completely decoupling scientific solvers from visualization and alerting logic.
