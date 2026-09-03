# Offline Geofencing, Synchronization & Stale Data Policy

## 1. Zero-Connectivity Physical Principles

### Fundamental Law: GPS Does Not Receive New Predictions
- Satellite GPS signals provide only coordinates ($X, Y, Z$) and time.
- GPS receiver chips cannot download new hydrodynamic model outputs when disconnected from cellular or internet networks.
- Therefore, offline danger detection relies exclusively on **locally cached risk polygons** stored in SQLite during the last successful synchronization.

---

## 2. Point-in-Polygon (Ray-Casting) Local Evaluation
When the mobile phone is completely offline:
1. Native location API obtains $(Lat, Lon)$.
2. The local `MobileGeofenceEngine` runs ray-casting intersection against cached Level 1, 2, and 3 polygons.
3. If the coordinate intersects a Level 3 polygon, a high-priority local notification and vibration pattern is triggered immediately on device.

---

## 3. Stale Data Freshness Status Tiers
The app displays data freshness based on elapsed time since the last synchronization:

| Status Tier | Elapsed Time | Visual Display | Action Required |
|---|---|---|---|
| **CURRENT** | $< 30\text{ minutes}$ | 🟢 Green Badge | Normal operation |
| **AGING** | $30 - 120\text{ minutes}$ | 🟡 Amber Badge | Monitor local announcements |
| **STALE** | $> 120\text{ minutes}$ | 🔴 Red Warning Banner | `⚠️ Flood-risk information may be outdated.` Reconnect when possible. |

---

## 4. Resilient Non-Destructive Synchronization
When internet connectivity is restored:
- The app fetches updated risk polygons from `/api/v1/flood-zones/risk-zones/{sim_id}`.
- New data is validated before updating SQLite.
- If network connection drops mid-transfer, previous valid cached data is strictly retained.
