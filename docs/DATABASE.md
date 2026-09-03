# PostGIS Database & Data Model Specifications

## Spatial Coordinate Reference Systems (CRS)
All geographic vector layers (Dams, Rivers, Risk Zones, Shelters, Evacuation Routes) are stored with explicit coordinate system definitions:
- **Standard Storage & API Representation:** `EPSG:4326` (WGS 84 Longitude/Latitude in Decimal Degrees).
- **Planar Hydrodynamic Computation:** Reprojected to appropriate UTM zones (e.g. `EPSG:32642` for Western India / Gujarat) for metric distance and slope calculations.
- Coordinates are never mixed implicitly.

---

## Entity Schema Reference

### 1. `dams`
- `id`: UUID (Primary Key)
- `name`: VARCHAR(255)
- `river_id`: UUID (Foreign Key -> `rivers.id`)
- `location`: Geometry(Point, 4326) / GeoJSON
- `latitude` / `longitude`: FLOAT
- `height_m`: FLOAT (Structural height above riverbed)
- `crest_length_m`: FLOAT
- `capacity_mcm`: FLOAT (Gross storage capacity in Million Cubic Meters)
- `full_reservoir_level_m`: FLOAT (FRL in meters)
- `current_water_level_m`: FLOAT
- `spillway_capacity_cumec`: FLOAT (Design discharge in m³/s)
- `dam_type`: VARCHAR(100) (e.g. Earthen Dam with Masonry Spillway)
- `state` / `district`: VARCHAR(100)

### 2. `scenarios`
- `id`: UUID (Primary Key)
- `dam_id`: UUID (Foreign Key -> `dams.id`)
- `name`: VARCHAR(255)
- `scenario_type`: ENUM (`DAM_BREAK`, `RIVER_BLOCKAGE`, `CONTROLLED_RELEASE`, `OVERTOPPING`)
- `failure_mode`: ENUM (`PIPING`, `OVERTOPPING`, `INSTANTANEOUS`, `GRADUAL`)
- `breach_width_m`: FLOAT
- `breach_depth_m`: FLOAT
- `breach_formation_time_hr`: FLOAT
- `peak_discharge_cumec`: FLOAT (Computed via Froehlich 1995 formula)
- `simulation_duration_hr`: FLOAT
- `grid_resolution_m`: FLOAT (30m standard)

### 3. `simulations`
- `id`: UUID (Primary Key)
- `scenario_id`: UUID (Foreign Key -> `scenarios.id`)
- `solver_type`: ENUM (`DELFT3D_FM`, `DUALSPHYSICS`, `HYBRID_COMPARISON`, `REFERENCE_SW_SPH`)
- `execution_mode`: ENUM (`REAL_SIMULATION`, `DEMO_REFERENCE`)
- `status`: ENUM (`QUEUED`, `VALIDATING`, `PREPARING`, `RUNNING_DELFT3D`, `RUNNING_SPH`, `PROCESSING`, `GENERATING_FLOOD`, `GENERATING_GIS`, `RUNNING_IMPACT`, `COMPLETED`, `FAILED`)
- `progress_pct`: FLOAT (0.0 to 100.0)
- `max_flood_extent_sqkm`: FLOAT
- `max_water_depth_m`: FLOAT
- `max_flow_velocity_ms`: FLOAT
- `min_arrival_time_min`: FLOAT

### 4. `risk_zones`
- `id`: UUID (Primary Key)
- `simulation_id`: UUID (Foreign Key -> `simulations.id`)
- `risk_level`: ENUM (`LEVEL_0_SAFE`, `LEVEL_1_WARNING`, `LEVEL_2_HIGH_RISK`, `LEVEL_3_CRITICAL`)
- `geometry`: Geometry(MultiPolygon, 4326)
- `area_sqkm`: FLOAT
- `max_depth_m`: FLOAT
- `max_velocity_ms`: FLOAT
- `min_arrival_time_min`: FLOAT

### 5. `impact_records`
- `id`: UUID (Primary Key)
- `simulation_id`: UUID (Foreign Key -> `simulations.id`)
- `exposed_buildings_count`: FLOAT
- `exposed_roads_length_km`: FLOAT
- `exposed_bridges_count`: FLOAT
- `exposed_schools_count`: FLOAT
- `exposed_hospitals_count`: FLOAT
- `exposed_population_estimate`: FLOAT
- `exposed_agriculture_sqkm`: FLOAT
- `critical_facilities_list`: JSON
- `summary_report`: JSON (Contains mandatory exposure vs damage disclaimers)
