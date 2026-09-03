# Push Notifications & Emergency Alerting Guide

## 1. Firebase Cloud Messaging (FCM) Integration
The platform uses FCM to deliver high-priority online push notifications to registered citizen mobile devices.

### Device Registration Flow
```
Citizen Mobile App
       │
       ▼ (1) Obtain FCM Registration Token
Backend API (POST /api/v1/devices/register)
       │
       ▼ (2) Store token in database with device OS
Database (devices table)
```

---

## 2. Notification Levels & Messages

### Level 1: Flood Watch
> **"Flood risk detected in downstream basin."**
> Low-lying floodplain areas may experience rising water levels. Stay informed.

### Level 2: High Risk Warning
> **"High flood inundation predicted. Prepare to evacuate."**
> Water depth expected between 0.5m - 1.5m. Move essential supplies to upper floors and prepare to evacuate.

### Level 3: Critical Dam-Break Emergency Alert
> **"CRITICAL FLOOD EMERGENCY. You are inside a predicted Level 3 danger zone."**
> Immediate life safety hazard ($>1.5\text{m}$ depth). Evacuate immediately to designated relief shelters via elevated routes.

---

## 3. Cooldown & Anti-Spam Deduplication
- **Zone Cooldown:** Devices inside the same risk polygon will not receive duplicate push notifications within a 15-minute cooldown window (`cooldown_minutes = 15.0`).
- **Severity Escalation:** If danger increases (e.g. Level 1 -> Level 3), notifications bypass cooldown immediately.
