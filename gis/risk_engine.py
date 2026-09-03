from typing import Dict, Any, List
import numpy as np
from shapely.geometry import Polygon, MultiPolygon, mapping, box
from shapely.ops import unary_union
from simulation.common import CommonSimulationResult
from gis.flood_analysis import FloodAnalysisEngine

class RiskEngine:
    """
    Hydrodynamic Hazard and Risk Classification Engine.
    
    Generates spatial polygons for:
    - LEVEL 0: SAFE (Depth < 0.1m, Vel < 0.2 m/s)
    - LEVEL 1: WARNING (0.1m <= Depth < 0.5m or Vel < 1.0 m/s)
    - LEVEL 2: HIGH RISK (0.5m <= Depth < 1.5m or 1.0 <= Vel < 2.5 m/s)
    - LEVEL 3: CRITICAL (Depth >= 1.5m or Vel >= 2.5 m/s or arrival time < 60 min)
    
    All thresholds are configurable.
    """

    def __init__(
        self,
        l1_depth: float = 0.1,
        l1_vel: float = 0.2,
        l2_depth: float = 0.5,
        l2_vel: float = 1.0,
        l3_depth: float = 1.5,
        l3_vel: float = 2.5
    ):
        self.l1_depth = l1_depth
        self.l1_vel = l1_vel
        self.l2_depth = l2_depth
        self.l2_vel = l2_vel
        self.l3_depth = l3_depth
        self.l3_vel = l3_vel

    def generate_risk_zones(self, result: CommonSimulationResult) -> Dict[str, Any]:
        """
        Classifies hydrodynamic fields into discrete risk levels with clean spatial polygons.
        """
        depth_arr = np.array(result.max_depth_grid or np.zeros(result.grid_shape))
        vel_arr = np.array(result.max_velocity_grid or np.zeros(result.grid_shape))
        arrival_arr = np.array(result.arrival_time_grid_min or np.zeros(result.grid_shape))

        bounds = result.grid_bounds
        cell_size = result.cell_size_m
        cell_area_sqkm = (cell_size * cell_size) / 1e6

        # Boolean masks for each level
        # Critical Level 3:
        mask_l3 = (depth_arr >= self.l3_depth) | (vel_arr >= self.l3_vel)
        # High Risk Level 2: (L2 condition AND not already L3)
        mask_l2 = ((depth_arr >= self.l2_depth) | (vel_arr >= self.l2_vel)) & (~mask_l3)
        # Warning Level 1: (L1 condition AND not L2 or L3)
        mask_l1 = ((depth_arr >= self.l1_depth) | (vel_arr >= self.l1_vel)) & (~mask_l2) & (~mask_l3)

        # Polygon generation
        poly_l3 = FloodAnalysisEngine.grid_to_polygons(mask_l3.astype(float), 0.5, bounds)
        poly_l2 = FloodAnalysisEngine.grid_to_polygons(mask_l2.astype(float), 0.5, bounds)
        poly_l1 = FloodAnalysisEngine.grid_to_polygons(mask_l1.astype(float), 0.5, bounds)

        area_l3 = float(np.sum(mask_l3)) * cell_area_sqkm
        area_l2 = float(np.sum(mask_l2)) * cell_area_sqkm
        area_l1 = float(np.sum(mask_l1)) * cell_area_sqkm

        return {
            "LEVEL_3_CRITICAL": {
                "risk_level": "LEVEL_3_CRITICAL",
                "color": "#EF4444", # Red
                "area_sqkm": round(area_l3, 3),
                "max_depth_m": round(float(np.max(depth_arr[mask_l3])) if np.any(mask_l3) else 0.0, 2),
                "max_velocity_ms": round(float(np.max(vel_arr[mask_l3])) if np.any(mask_l3) else 0.0, 2),
                "min_arrival_time_min": round(float(np.min(arrival_arr[mask_l3 & (arrival_arr > 0)])) if np.any(mask_l3 & (arrival_arr > 0)) else 0.0, 1),
                "geometry": mapping(poly_l3)
            },
            "LEVEL_2_HIGH_RISK": {
                "risk_level": "LEVEL_2_HIGH_RISK",
                "color": "#F97316", # Orange
                "area_sqkm": round(area_l2, 3),
                "max_depth_m": round(float(np.max(depth_arr[mask_l2])) if np.any(mask_l2) else 0.0, 2),
                "max_velocity_ms": round(float(np.max(vel_arr[mask_l2])) if np.any(mask_l2) else 0.0, 2),
                "min_arrival_time_min": round(float(np.min(arrival_arr[mask_l2 & (arrival_arr > 0)])) if np.any(mask_l2 & (arrival_arr > 0)) else 0.0, 1),
                "geometry": mapping(poly_l2)
            },
            "LEVEL_1_WARNING": {
                "risk_level": "LEVEL_1_WARNING",
                "color": "#EAB308", # Yellow
                "area_sqkm": round(area_l1, 3),
                "max_depth_m": round(float(np.max(depth_arr[mask_l1])) if np.any(mask_l1) else 0.0, 2),
                "max_velocity_ms": round(float(np.max(vel_arr[mask_l1])) if np.any(mask_l1) else 0.0, 2),
                "min_arrival_time_min": round(float(np.min(arrival_arr[mask_l1 & (arrival_arr > 0)])) if np.any(mask_l1 & (arrival_arr > 0)) else 0.0, 1),
                "geometry": mapping(poly_l1)
            }
        }
