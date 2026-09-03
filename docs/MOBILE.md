# Citizen Mobile Application Architecture Guide

## 1. Overview
The mobile app is built with **React Native + TypeScript + Expo** designed specifically for ordinary citizens with large, high-visibility hazard indicators, offline emergency instructions, shelter routing, and zero-connectivity geofencing.

---

## 2. Directory Layout (`/mobile`)
```
mobile/
├── assets/                  # Icons & Splash assets
├── src/
│   ├── screens/             # 10 Screen components
│   │   ├── HomeScreen.tsx           # Status hero card & nearest shelter
│   │   ├── CurrentRiskScreen.tsx    # GPS Point-in-Polygon scanner
│   │   ├── FloodMapScreen.tsx       # Offline cached vector map
│   │   ├── AlertsScreen.tsx         # Emergency broadcast list
│   │   ├── SheltersScreen.tsx       # Shelters & Safe corridors
│   │   ├── EmergencyInfoScreen.tsx  # Lifesaving instructions
│   │   ├── GoogleLoginScreen.tsx    # Google OAuth sign in
│   │   ├── PermissionSetupScreen.tsx# Transparent location consent
│   │   └── OfflineStatusScreen.tsx  # Stale data & sync diagnostics
│   ├── services/
│   │   ├── db.ts            # SQLite / Local storage layer
│   │   ├── geofence.ts      # Ray-casting Point-in-Polygon engine
│   │   ├── notifications.ts # Local notifications & cooldown
│   │   └── sync.ts          # Resilient sync manager
│   └── types/               # Mobile TypeScript interfaces
├── App.tsx                  # Navigation container & Bottom tabs
├── app.json                 # Expo SDK configuration
└── package.json             # NPM dependencies
```

---

## 3. Privacy-Preserving GPS Policy
- Location is requested solely to evaluate whether the citizen is located inside a predicted dam breach hazard polygon.
- Private location traces are never transmitted to marketing servers or stored without consent.
- Geofence calculation is executed locally on the device's CPU.
