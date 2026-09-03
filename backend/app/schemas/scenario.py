from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.scenario import ScenarioType, BreachFailureMode

class ScenarioBase(BaseModel):
    dam_id: str
    name: str = Field(..., example="Machhu-II Dam Break - Worst Case 100m Breach")
    description: Optional[str] = Field(default="Hydrodynamic dam breach simulation under full reservoir conditions.")
    scenario_type: ScenarioType = Field(default=ScenarioType.DAM_BREAK)
    failure_mode: BreachFailureMode = Field(default=BreachFailureMode.PIPING)
    reservoir_water_level_m: float = Field(..., gt=0, example=57.0)
    reservoir_level_pct: float = Field(default=100.0, ge=10, le=150)
    breach_width_m: float = Field(default=50.0, gt=0, le=2000)
    breach_depth_m: float = Field(default=15.0, gt=0, le=200)
    breach_formation_time_hr: float = Field(default=1.5, gt=0.01, le=48)
    breach_side_slope_z: float = Field(default=1.0, ge=0)
    downstream_boundary_type: str = Field(default="FREE_OUTFLOW")
    simulation_duration_hr: float = Field(default=6.0, gt=0.1, le=72)
    time_step_seconds: float = Field(default=1.0, gt=0.01, le=60)
    grid_resolution_m: float = Field(default=30.0, ge=5, le=500)
    parameters_json: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioResponse(ScenarioBase):
    id: str
    peak_discharge_cumec: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ScenarioComparisonSummary(BaseModel):
    scenario_id: str
    name: str
    scenario_type: ScenarioType
    breach_width_m: float
    reservoir_level_pct: float
    flooded_area_sqkm: float
    max_depth_m: float
    max_velocity_ms: float
    min_arrival_time_min: float
    exposed_population: float
    exposed_buildings: float
    exposed_roads_km: float
