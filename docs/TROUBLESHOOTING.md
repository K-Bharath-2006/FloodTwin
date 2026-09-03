# Troubleshooting & Diagnostic Guide

## 1. Common Issues & Solutions

### A. OpenBLAS Memory Allocation Error on Windows
- **Symptom:** `OpenBLAS error: Memory allocation still failed after 10 retries, giving up.`
- **Cause:** Windows OpenBLAS multithreading conflict in specific terminal shells.
- **Fix:** Set thread environment variables before importing NumPy:
  ```python
  import os
  os.environ["OPENBLAS_NUM_THREADS"] = "1"
  os.environ["OMP_NUM_THREADS"] = "1"
  ```

### B. Delft3D-FM / DualSPHysics Executable Missing
- **Symptom:** `Delft3D executable not found at '<path>'`.
- **Fix:** Either set `DELFT3D_EXECUTABLE` in `.env` or select `DEMO_REFERENCE` execution mode, which automatically invokes the calibrated 2D Saint-Venant Shallow Water / SPH reference engine and clearly marks output as `DEMO / REFERENCE RESULT`.

### C. Google Earth Engine (GEE) Credentials Missing
- **Symptom:** `GEE validation unavailable — credentials/project not configured.`
- **Fix:** Configure `GEE_PROJECT` and `GEE_SERVICE_ACCOUNT` in `.env`. In development, the engine automatically uses open Sentinel-1 SAR reference baselines.

### D. Mobile Offline Stale Data Indicator
- **Symptom:** Warning banner: `⚠️ Flood-risk information may be outdated.`
- **Cause:** Local cache was synchronized more than 2 hours ago.
- **Fix:** Connect the device to internet and click `Synchronize with Backend` in the mobile app.
