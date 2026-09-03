import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class SimulationStatus(str, Enum):
    QUEUED = "QUEUED"
    VALIDATING = "VALIDATING"
    PREPARING = "PREPARING"
    RUNNING_DELFT3D = "RUNNING_DELFT3D"
    RUNNING_SPH = "RUNNING_SPH"
    PROCESSING = "PROCESSING"
    GENERATING_FLOOD = "GENERATING_FLOOD"
    GENERATING_GIS = "GENERATING_GIS"
    RUNNING_IMPACT = "RUNNING_IMPACT"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class SolverType(str, Enum):
    DELFT3D_FM = "DELFT3D_FM"
    DUALSPHYSICS = "DUALSPHYSICS"
    HYBRID_COMPARISON = "HYBRID_COMPARISON" # Runs both and computes differences
    REFERENCE_SW_SPH = "REFERENCE_SW_SPH" # Educational/Reference solver

class ExecutionMode(str, Enum):
    REAL_SIMULATION = "REAL_SIMULATION"
    DEMO_REFERENCE = "DEMO_REFERENCE"

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id = Column(String(36), ForeignKey("scenarios.id"), nullable=False)
    solver_type = Column(SQLEnum(SolverType), default=SolverType.HYBRID_COMPARISON, nullable=False)
    execution_mode = Column(SQLEnum(ExecutionMode), default=ExecutionMode.DEMO_REFERENCE, nullable=False)
    status = Column(SQLEnum(SimulationStatus), default=SimulationStatus.QUEUED, nullable=False, index=True)
    progress_pct = Column(Float, default=0.0)
    current_stage = Column(String(100), default="Queued in job queue")

    # Metrics Summary
    max_flood_extent_sqkm = Column(Float, nullable=True)
    max_water_depth_m = Column(Float, nullable=True)
    max_flow_velocity_ms = Column(Float, nullable=True)
    min_arrival_time_min = Column(Float, nullable=True)
    total_flooded_volume_mcm = Column(Float, nullable=True)
    computation_time_seconds = Column(Float, nullable=True)

    # Isolated Working Paths & Artifacts
    workspace_dir = Column(String(512), nullable=True)
    output_raster_path = Column(String(512), nullable=True)
    common_format_json_path = Column(String(512), nullable=True)

    # Logging & Diagnostics
    solver_stdout = Column(Text, nullable=True)
    solver_stderr = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    logs_json = Column(JSON, default=list) # Timestamped log events

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    scenario = relationship("Scenario", back_populates="simulations")
    flood_zones = relationship("FloodZone", back_populates="simulation", cascade="all, delete-orphan")
    risk_zones = relationship("RiskZone", back_populates="simulation", cascade="all, delete-orphan")
    impact_record = relationship("ImpactRecord", back_populates="simulation", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="simulation", cascade="all, delete-orphan")
    satellite_observations = relationship("SatelliteObservation", back_populates="simulation", cascade="all, delete-orphan")
