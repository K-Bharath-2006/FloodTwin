import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class ScenarioType(str, Enum):
    DAM_BREAK = "DAM_BREAK" # Scenario A
    RIVER_BLOCKAGE = "RIVER_BLOCKAGE" # Scenario B
    CONTROLLED_RELEASE = "CONTROLLED_RELEASE" # Scenario C
    OVERTOPPING = "OVERTOPPING" # Scenario D (Optional Extension)

class BreachFailureMode(str, Enum):
    PIPING = "PIPING"
    OVERTOPPING = "OVERTOPPING"
    INSTANTANEOUS = "INSTANTANEOUS"
    GRADUAL = "GRADUAL"

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dam_id = Column(String(36), ForeignKey("dams.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(1024), nullable=True)
    scenario_type = Column(SQLEnum(ScenarioType), default=ScenarioType.DAM_BREAK, nullable=False)
    failure_mode = Column(SQLEnum(BreachFailureMode), default=BreachFailureMode.PIPING, nullable=False)

    # Hydrological & Structural Parameters
    reservoir_water_level_m = Column(Float, nullable=False)
    reservoir_level_pct = Column(Float, default=100.0) # Percentage of FRL
    breach_width_m = Column(Float, default=50.0)
    breach_depth_m = Column(Float, default=15.0)
    breach_formation_time_hr = Column(Float, default=1.5)
    breach_side_slope_z = Column(Float, default=1.0) # Trapezoidal breach side slope (H:V)
    peak_discharge_cumec = Column(Float, nullable=True) # Calculated or specified peak outflow (m3/s)

    # Simulation Boundary Parameters
    downstream_boundary_type = Column(String(50), default="FREE_OUTFLOW") # FREE_OUTFLOW, WATER_LEVEL, DISCHARGE
    simulation_duration_hr = Column(Float, default=6.0) # Total simulation time
    time_step_seconds = Column(Float, default=1.0) # Computational time step
    grid_resolution_m = Column(Float, default=30.0) # Spatial mesh grid size in meters

    parameters_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    dam = relationship("Dam", back_populates="scenarios")
    simulations = relationship("Simulation", back_populates="scenario", cascade="all, delete-orphan")
