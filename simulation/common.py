from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import numpy as np

@dataclass
class HydrodynamicGridPoint:
    x: float
    y: float
    elevation_m: float
    water_level_m: float
    water_depth_m: float
    velocity_x_ms: float
    velocity_y_ms: float
    velocity_magnitude_ms: float
    is_flooded: bool

@dataclass
class SimulationTimeStep:
    timestamp_seconds: float
    time_minutes: float
    water_depth_grid: List[List[float]] # 2D array [ny][nx]
    velocity_magnitude_grid: List[List[float]] # 2D array [ny][nx]
    velocity_x_grid: List[List[float]]
    velocity_y_grid: List[List[float]]
    water_level_grid: List[List[float]]
    inundation_mask: List[List[bool]]
    total_flooded_area_sqkm: float
    max_depth_m: float
    max_velocity_ms: float

@dataclass
class CommonSimulationResult:
    """
    Standardized Hydrodynamic Output representation.
    Both Delft3D-FM and SPH solvers normalize into this exact format.
    Downstream GIS, Risk, and Exposure engines operate ONLY on this format.
    """
    solver_name: str
    scenario_id: str
    simulation_id: str
    grid_bounds: Dict[str, float] # min_x, min_y, max_x, max_y (in EPSG:4326)
    grid_shape: tuple # (rows, cols)
    cell_size_m: float
    time_steps: List[SimulationTimeStep] = field(default_factory=list)
    max_depth_grid: Optional[List[List[float]]] = None
    max_velocity_grid: Optional[List[List[float]]] = None
    arrival_time_grid_min: Optional[List[List[float]]] = None # Minutes to reach threshold depth (e.g. 0.1m)
    total_area_flooded_sqkm: float = 0.0
    peak_water_depth_m: float = 0.0
    peak_velocity_ms: float = 0.0
    min_arrival_time_min: float = 0.0
    solver_execution_time_sec: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "solver_name": self.solver_name,
            "scenario_id": self.scenario_id,
            "simulation_id": self.simulation_id,
            "grid_bounds": self.grid_bounds,
            "grid_shape": self.grid_shape,
            "cell_size_m": self.cell_size_m,
            "total_area_flooded_sqkm": round(self.total_area_flooded_sqkm, 3),
            "peak_water_depth_m": round(self.peak_water_depth_m, 2),
            "peak_velocity_ms": round(self.peak_velocity_ms, 2),
            "min_arrival_time_min": round(self.min_arrival_time_min, 1),
            "solver_execution_time_sec": round(self.solver_execution_time_sec, 2),
            "metadata": self.metadata,
            "time_steps_count": len(self.time_steps)
        }
