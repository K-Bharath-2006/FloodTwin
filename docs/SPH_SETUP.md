# DualSPHysics SPH Integration & Configuration Guide

## 1. Overview
The platform integrates **DualSPHysics** (Smoothed Particle Hydrodynamics) via the `SPHAdapter` to model violent 3D fluid-structure impact, dam wall breach surge momentum, and non-linear wave cresting.

---

## 2. Binary Installation Instructions

### Linux (Ubuntu 22.04 / CUDA or CPU)
1. Download DualSPHysics v5.2 package:
   ```bash
   tar -xzf DualSPHysics_v5.2.tar.gz -C /opt/dualsphysics
   chmod +x /opt/dualsphysics/bin/linux/*
   ```

2. Test execution:
   ```bash
   /opt/dualsphysics/bin/linux/DualSPHysics5.2_CPU_linux64 -h
   ```

### Windows (x64)
1. Download Windows executable bundle from DualSPHysics.org.
2. Locate `GenCase4_win64.exe` and `DualSPHysics5.2_win64.exe`.

---

## 3. Environment Variable Configuration
```env
SPH_EXECUTABLE=/opt/dualsphysics/bin/linux/DualSPHysics5.2_CPU_linux64
SPH_WORKDIR=./simulation_runs/sph
SPH_TIMEOUT_SECONDS=7200
```

---

## 4. Adapter Execution Pipeline
1. **GenCase XML Generation:** Generates `CaseDam_Def.xml` with fluid volume, dam structure, and particle resolution spacing $dp = 1.0\text{m}$.
2. **GenCase Meshing:** Discretizes boundaries and fluid into SPH particles.
3. **DualSPHysics Solver Run:** Solves particle momentum using the Wendland quintic kernel and Verlet stepping.
4. **Surface Height & Velocity Extraction:** Converts particle arrays into standardized `CommonSimulationResult` grids.

*Note: In the absence of native DualSPHysics binaries, the system runs the SPH particle kinematic reference engine with clear `DEMO / REFERENCE RESULT` labeling.*
