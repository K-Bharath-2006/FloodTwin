# Delft3D-FM (D-Flow FM) Integration & Configuration Guide

## 1. Overview
The platform integrates Deltares Delft3D Flexible Mesh (D-Flow FM 2D) via the `Delft3DAdapter` process supervisor.

---

## 2. Binary Installation Instructions

### Linux (Ubuntu 22.04 / Debian)
1. Download Delft3D-FM Open Source Suite from Deltares:
   ```bash
   # Extract D-Flow FM binaries
   tar -xzf delft3dfm_2024.tar.gz -C /opt/delft3dfm
   export PATH="/opt/delft3dfm/bin:$PATH"
   export LD_LIBRARY_PATH="/opt/delft3dfm/lib:$LD_LIBRARY_PATH"
   ```

2. Verify installation:
   ```bash
   dflowfm --version
   ```

### Windows (x64)
1. Install Delft3D FM from official installer.
2. Locate `dflowfm.exe` in `C:\Program Files\Deltares\Delft3D FM Suite\plugins\Deltares.Flow2D3D\bin\dflowfm.exe`.

---

## 3. Environment Variable Configuration
Configure the executable path in your `.env` file:
```env
DELFT3D_EXECUTABLE=/opt/delft3dfm/bin/dflowfm
DELFT3D_CONFIG=
DELFT3D_WORKDIR=./simulation_runs/delft3d
DELFT3D_TIMEOUT_SECONDS=7200
```

---

## 4. Adapter Execution Pipeline
1. **Directory Isolation:** Creates `simulation_runs/{sim_id}/input/`.
2. **MDU Generation:** Generates `flow2d.mdu` with timestep, CFL constraints, and roughness coefficients.
3. **Boundary Hydrograph:** Generates `boundary_conditions.bc` with time-series breach discharge $Q(t)$.
4. **Execution Supervision:** Launches process via `subprocess.Popen`, capturing STDOUT and STDERR logs with timeout handling.
5. **Output Normalization:** Reads NetCDF map output (`*_map.nc`) and converts to `CommonSimulationResult`.

*Note: If `DELFT3D_EXECUTABLE` is not present, the system cleanly logs a configuration notice and executes the calibrated Reference 2D Saint-Venant Shallow Water Solver tagged as `DEMO / REFERENCE RESULT`.*
