from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from backend.app.models.simulation import SimulationStatus, SolverType, ExecutionMode

class SimulationCreate(BaseModel):
    scenario_id: str
    solver_type: SolverType = Field(default=SolverType.HYBRID_COMPARISON)
    execution_mode: ExecutionMode = Field(default=ExecutionMode.DEMO_REFERENCE)

class SimulationStatusResponse(BaseModel):
    id: str
    scenario_id: str
    solver_type: SolverType
    execution_mode: ExecutionMode
    status: SimulationStatus
    progress_pct: float
    current_stage: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    computation_time_seconds: Optional[float] = None
    error_message: Optional[str] = None
    logs_json: List[Dict[str, Any]] = Field(default_factory=list)

    class Config:
        from_attributes = True

class SimulationResponse(SimulationStatusResponse):
    max_flood_extent_sqkm: Optional[float] = None
    max_water_depth_m: Optional[float] = None
    max_flow_velocity_ms: Optional[float] = None
    min_arrival_time_min: Optional[float] = None
    total_flooded_volume_mcm: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SolverComparisonMetric(BaseModel):
    metric_name: str
    delft3d_value: float
    sph_value: float
    absolute_difference: float
    relative_difference_pct: float
    unit: str

class SimulationComparisonResponse(BaseModel):
    simulation_id: str
    delft3d_extent_sqkm: float
    sph_extent_sqkm: float
    delft3d_max_depth_m: float
    sph_max_depth_m: float
    delft3d_max_velocity_ms: float
    sph_max_velocity_ms: float
    metrics: List[SolverComparisonMetric]
    difference_summary: str
