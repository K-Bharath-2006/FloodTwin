# GIS Processing, Risk Vectorization & Automated Export Specifications

## 1. Raster-to-Polygon Vectorization Pipeline

Continuous hydrodynamic scalar depth rasters are converted into discrete vector polygons through:
1. **Contour/Cell Polygonization:** Identification of wet cells above configured threshold depth ($h \ge 0.10\text{m}$).
2. **Topological Union & Boundary Smoothing:** `shapely.ops.unary_union` and spatial buffering (`buffer(0.0001).buffer(-0.00005)`) to eliminate sliver polygons.
3. **Geometry Validation:** Sanitization via `shapely.make_valid()`.

---

## 2. Risk Classification Matrices

The `RiskEngine` calculates 4 discrete hazard tiers:
- **LEVEL 0 (SAFE):** Depth $< 0.10\text{m}$ and Velocity $< 0.20\text{m/s}$
- **LEVEL 1 (WARNING):** $0.10\text{m} \le \text{Depth} < 0.50\text{m}$ or Velocity $< 1.0\text{m/s}$
- **LEVEL 2 (HIGH RISK):** $0.50\text{m} \le \text{Depth} < 1.50\text{m}$ or $1.0\text{m/s} \le \text{Velocity} < 2.50\text{m/s}$
- **LEVEL 3 (CRITICAL):** $\text{Depth} \ge 1.50\text{m}$ or $\text{Velocity} \ge 2.50\text{m/s}$ or arrival time $< 60\text{ min}$

---

## 3. Automated Zero-QGIS Export Packaging

The `GISExportEngine` generates:

### A. ESRI Shapefile Bundle (`flood_zones.zip`)
- `.shp`: Binary Shapefile geometry (ShapeType 5: Polygon)
- `.shx`: Spatial Index file
- `.dbf`: dBASE III attribute table (Fields: `RISK_LVL`, `AREA_SQKM`, `MAX_DP_M`, `MAX_VL_MS`)
- `.prj`: Coordinate Reference System WKT (`EPSG:4326`)

### B. OGC KML 2.2 (`flood_zones.kml`)
- Color-coded line styles and semi-transparent polygon fills.
- Clamped-to-ground altitude modes compatible with Google Earth Pro and Google Earth Web.

### C. GeoJSON Standard (`flood_zones.geojson`)
- RFC 7946 compliant FeatureCollection in `EPSG:4326`.
