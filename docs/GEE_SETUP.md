# Google Earth Engine (GEE) Satellite Observation & Validation Guide

## 1. Overview
The platform integrates Google Earth Engine for **Near-Real-Time Satellite-Based Flood Monitoring & Validation** using Sentinel-1 C-Band Synthetic Aperture Radar (SAR) and Sentinel-2 Multi-Spectral Imagery (MSI).

*Important: This workflow is designated as near-real-time satellite observation, not live video stream.*

---

## 2. GEE Service Account Setup
1. Create a Google Cloud Project with the Earth Engine API enabled.
2. Create a Service Account in IAM: `gee-flood-validator@your-project.iam.gserviceaccount.com`.
3. Generate and download a JSON Private Key.
4. Register the Service Account in Google Earth Engine.

---

## 3. Environment Variables
```env
GEE_PROJECT=sih-damflood-gee
GEE_SERVICE_ACCOUNT=gee-flood-validator@sih-damflood-gee.iam.gserviceaccount.com
GEE_PRIVATE_KEY_FILE=/path/to/gee-service-key.json
```

---

## 4. SAR Flood Extraction Algorithm
1. **Product Collection:** `COPERNICUS/S1_GRD` Interferometric Wide (IW) mode, Ground Range Detected.
2. **Polarization:** Dual polarization (VV and VH).
3. **Speckle Filtering:** Lee filter ($7 \times 7$ window).
4. **Otsu Thresholding:** Dynamic bimodal thresholding on backscatter decibel values (water backscatter typically $<-16\text{ dB}$).
5. **Topographic Masking:** Elevation slope masking using SRTM 30m DEM (slopes $>5\%$ masked to avoid radar shadow misclassification).

---

## 5. Quantitative Validation Metrics
- **Intersection over Union (IoU / Jaccard Similarity Index):**
  $$\text{IoU} = \frac{\text{Area}(\text{Simulated} \cap \text{Observed})}{\text{Area}(\text{Simulated} \cup \text{Observed})}$$
- **Overlap Percentage:** Ratio of model prediction confirmed by satellite pass.
- **False Positive Area ($km^2$):** Model over-prediction where satellite observed dry ground.
- **False Negative Area ($km^2$):** Satellite detected standing water missed by simulation.
