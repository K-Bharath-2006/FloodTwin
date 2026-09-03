# Comprehensive Testing & Verification Guide

## 1. Automated Test Execution

### A. Backend & GIS Test Suite
```bash
pytest tests/ -v
```
Tests:
- `test_api.py`: FastAPI endpoints for Dams, Rivers, Datasets, Scenarios, Simulations, Flood Zones, Risk Zones, Impacts, GIS Exports, Alerts, and Health probes.
- `test_simulation.py`: Delft3D MDU generation, DualSPHysics XML definition, and Reference Hydrodynamic 2D Solver.
- `test_gis.py`: Raster-to-vector polygonization, RiskEngine 4-tier hazard classification, Infrastructure Exposure overlay, and Shapefile ZIP bundle validation.

### B. Mobile Geofence Test
```bash
node mobile/test_geofence.js
```
Tests:
- Point-in-polygon inside Level 3 Critical zone detection.
- Point-in-polygon outside danger zone detection.
- Stale data age calculation ($>120\text{ minutes}$).

### C. 10-Stage Full End-to-End Integration Pipeline
```bash
python scripts/test_e2e_pipeline.py
```
Validates the complete workflow:
`Dam + River → Scenario → Multi-Solver Hydrodynamics → Flood Extent → Risk Tiers → Impact Overlay → Shapefile ZIP Export → GEE Validation → Reverse Flood Match → Completed State`.
