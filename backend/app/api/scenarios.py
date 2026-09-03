from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.scenario import Scenario, ScenarioType, BreachFailureMode
from backend.app.models.dam import Dam
from backend.app.models.simulation import Simulation, SimulationStatus
from backend.app.models.flood import ImpactRecord
from backend.app.schemas.scenario import ScenarioResponse, ScenarioCreate, ScenarioComparisonSummary
from backend.app.models.user import User, UserRole
from backend.app.auth.security import get_current_user, require_role

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

@router.get("", response_model=List[ScenarioResponse])
def list_scenarios(dam_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists scenarios, optionally filtered by Dam ID."""
    q = db.query(Scenario)
    if dam_id:
        q = q.filter(Scenario.dam_id == dam_id)
    return q.all()

@router.get("/compare", response_model=List[ScenarioComparisonSummary])
def compare_scenarios(scenario_ids: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Compares what-if scenario outputs (Breach Width vs Inundation Area, Peak Depth, Arrival Time, Exposed Population).
    """
    q = db.query(Scenario)
    if scenario_ids:
        id_list = [s.strip() for s in scenario_ids.split(",") if s.strip()]
        q = q.filter(Scenario.id.in_(id_list))
    
    scenarios = q.all()
    results = []

    for sc in scenarios:
        # Find latest completed simulation for this scenario
        sim = db.query(Simulation).filter(
            Simulation.scenario_id == sc.id,
            Simulation.status == SimulationStatus.COMPLETED
        ).order_by(Simulation.completed_at.desc()).first()

        impact = db.query(ImpactRecord).filter(ImpactRecord.simulation_id == sim.id).first() if sim else None

        results.append({
            "scenario_id": sc.id,
            "name": sc.name,
            "scenario_type": sc.scenario_type,
            "breach_width_m": sc.breach_width_m,
            "reservoir_level_pct": sc.reservoir_level_pct,
            "flooded_area_sqkm": sim.max_flood_extent_sqkm if sim else 0.0,
            "max_depth_m": sim.max_water_depth_m if sim else 0.0,
            "max_velocity_ms": sim.max_flow_velocity_ms if sim else 0.0,
            "min_arrival_time_min": sim.min_arrival_time_min if sim else 0.0,
            "exposed_population": impact.exposed_population_estimate if impact else 0.0,
            "exposed_buildings": impact.exposed_buildings_count if impact else 0.0,
            "exposed_roads_km": impact.exposed_roads_length_km if impact else 0.0
        })

    return results

@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """Retrieves single scenario details."""
    sc = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not sc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found.")
    return sc

@router.post("", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
def create_scenario(
    sc_in: ScenarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MODELLER]))
):
    """
    Creates a new Dam-Break / River-Blockage / Controlled-Release hydrodynamic scenario.
    Automatically calculates peak breach discharge (Froehlich 1995 equation).
    """
    dam = db.query(Dam).filter(Dam.id == sc_in.dam_id).first()
    if not dam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referenced Dam does not exist.")

    # Peak breach discharge via Froehlich (1995b) formula
    v_w = dam.capacity_mcm * 1e6 # m3
    h_w = sc_in.breach_depth_m
    calculated_q_peak = 0.607 * (v_w ** 0.295) * (h_w ** 1.24)

    scenario = Scenario(
        dam_id=sc_in.dam_id,
        name=sc_in.name,
        description=sc_in.description,
        scenario_type=sc_in.scenario_type,
        failure_mode=sc_in.failure_mode,
        reservoir_water_level_m=sc_in.reservoir_water_level_m,
        reservoir_level_pct=sc_in.reservoir_level_pct,
        breach_width_m=sc_in.breach_width_m,
        breach_depth_m=sc_in.breach_depth_m,
        breach_formation_time_hr=sc_in.breach_formation_time_hr,
        breach_side_slope_z=sc_in.breach_side_slope_z,
        peak_discharge_cumec=round(calculated_q_peak, 2),
        downstream_boundary_type=sc_in.downstream_boundary_type,
        simulation_duration_hr=sc_in.simulation_duration_hr,
        time_step_seconds=sc_in.time_step_seconds,
        grid_resolution_m=sc_in.grid_resolution_m,
        parameters_json=sc_in.parameters_json or {}
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario
