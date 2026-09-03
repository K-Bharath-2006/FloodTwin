import math
from typing import Dict, Any, List, Tuple
import numpy as np
from shapely.geometry import Polygon, MultiPolygon, mapping, box
from shapely.ops import unary_union
from simulation.common import CommonSimulationResult, SimulationTimeStep

class FloodAnalysisEngine:
    """
    Hydrodynamic Flood Analysis Engine.
    Vectorizes continuous raster grids into clean geometric flood extent polygons
    and calculates depth, velocity, and arrival time profiles.
    """

    @staticmethod
    def grid_to_polygons(
        grid: np.ndarray,
        threshold: float,
        bounds: Dict[str, float],
        min_poly_area: float = 0.0000001
    ) -> MultiPolygon:
        """
        Converts 2D scalar grid above threshold into GeoJSON-compatible MultiPolygon in EPSG:4326.
        """
        ny, nx = grid.shape
        min_x = bounds.get("min_x", 70.80)
        min_y = bounds.get("min_y", 22.70)
        max_x = bounds.get("max_x", 70.98)
        max_y = bounds.get("max_y", 22.86)

        dx = (max_x - min_x) / nx
        dy = (max_y - min_y) / ny

        cell_polygons = []
        for j in range(ny):
            for i in range(nx):
                val = grid[j, i]
                if val >= threshold:
                    # Cell bounds
                    c_min_x = min_x + i * dx
                    c_max_x = c_min_x + dx
                    c_max_y = max_y - j * dy
                    c_min_y = c_max_y - dy

                    cell_polygons.append(box(c_min_x, c_min_y, c_max_x, c_max_y))

        if not cell_polygons:
            return MultiPolygon([])

        # Merge contiguous cells into unioned multipolygon and buffer to smooth boundaries
        unioned = unary_union(cell_polygons)
        smoothed = unioned.buffer(0.0001).buffer(-0.00005)

        if isinstance(smoothed, Polygon):
            return MultiPolygon([smoothed])
        elif isinstance(smoothed, MultiPolygon):
            return smoothed
        else:
            return MultiPolygon([])

    def analyze_simulation_result(self, result: CommonSimulationResult) -> Dict[str, Any]:
        """
        Processes CommonSimulationResult and produces vector flood zones for every timestep and maximum envelope.
        """
        max_depth_arr = np.array(result.max_depth_grid or np.zeros(result.grid_shape))
        max_vel_arr = np.array(result.max_velocity_grid or np.zeros(result.grid_shape))
        arrival_arr = np.array(result.arrival_time_grid_min or np.zeros(result.grid_shape))

        # Overall maximum flood extent (> 0.1m)
        max_extent_poly = self.grid_to_polygons(max_depth_arr, 0.10, result.grid_bounds)
        max_extent_geojson = mapping(max_extent_poly)

        # Time series flood extents
        timestep_features = []
        for step in result.time_steps:
            step_depth = np.array(step.water_depth_grid)
            step_poly = self.grid_to_polygons(step_depth, 0.10, result.grid_bounds)
            timestep_features.append({
                "time_minutes": step.time_minutes,
                "timestamp_seconds": step.timestamp_seconds,
                "area_sqkm": step.total_flooded_area_sqkm,
                "max_depth_m": step.max_depth_m,
                "max_velocity_ms": step.max_velocity_ms,
                "geometry": mapping(step_poly)
            })

        return {
            "max_flood_extent": max_extent_geojson,
            "max_flood_area_sqkm": result.total_area_flooded_sqkm,
            "peak_water_depth_m": result.peak_water_depth_m,
            "peak_velocity_ms": result.peak_velocity_ms,
            "min_arrival_time_min": result.min_arrival_time_min,
            "timestep_series": timestep_features
        }
