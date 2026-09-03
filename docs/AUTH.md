# Authentication & Role-Based Access Control (RBAC) Guide

## 1. Google OAuth 2.0 & OpenID Connect Architecture

```
Web Dashboard (React) / Mobile App (React Native)
            │
            ▼ (1) Google Sign-In SDK
Google OAuth 2.0 Identity Provider
            │
            ▼ (2) id_token returned
FastAPI Backend (POST /api/v1/auth/google)
            │
            ▼ (3) Verify token signature via google-auth
Database (Find or auto-provision User record)
            │
            ▼ (4) Issue secure HS256 JWT Access Token
Client Session Authenticated (Bearer Token)
```

---

## 2. Role-Based Access Control (RBAC) Matrix

| Endpoint / Action | ADMIN | MODELLER | VIEWER | CITIZEN |
|---|:---:|:---:|:---:|:---:|
| **View Dashboard & Risk Maps** | ✅ | ✅ | ✅ | ✅ |
| **View Shelters & Evacuation Routes** | ✅ | ✅ | ✅ | ✅ |
| **Receive Emergency Geofence Alerts** | ✅ | ✅ | ✅ | ✅ |
| **Download GIS Exports (SHP/KML/GeoJSON)** | ✅ | ✅ | ✅ | ❌ |
| **Create What-If Breach Scenarios** | ✅ | ✅ | ❌ | ❌ |
| **Launch Hydrodynamic Simulations** | ✅ | ✅ | ❌ | ❌ |
| **Upload DEM & Infrastructure Datasets** | ✅ | ✅ | ❌ | ❌ |
| **Broadcast Emergency Alerts (FCM Push)** | ✅ | ✅ | ❌ | ❌ |
| **System Health & User Administration** | ✅ | ❌ | ❌ | ❌ |

---

## 3. Security Requirements
- Google credentials or user passwords are never stored in the database.
- JWT tokens expire after 24 hours (`ACCESS_TOKEN_EXPIRE_MINUTES=1440`).
- Secret keys are loaded strictly from environment variables.
