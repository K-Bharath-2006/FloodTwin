import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from simulation.reference_solver import ReferenceHydrodynamicSolver
from simulation.delft3d.adapter import Delft3DAdapter
from simulation.sph.adapter import SPHAdapter
from simulation.engine import SimulationEngine
from simulation.common import CommonSimulationResult

def test_reference_hydrodynamic_solver_delft3d():
    solver = ReferenceHydrodynamicSolver(nx=40, ny=30, dx=30.0, dy=30.0)
    sc_params = {
        "breach_width_m": 50.0,
        "breach_depth_m": 15.0,
        "reservoir_water_level_m": 25.0,
        "breach_formation_time_hr": 1.0,
        "simulation_duration_hr": 2.0,
        "scenario_type": "DAM_BREAK"
    }
    dam_info = {
        "latitude": 22.76,
        "longitude": 70.88,
        "capacity_mcm": 110.0,
        "manning_n": 0.035
    }
    res = solver.solve("sc-1", "sim-1", sc_params, dam_info, solver_flavor="DELFT3D_SWE")
    
    assert isinstance(res, CommonSimulationResult)
    assert res.total_area_flooded_sqkm > 0.0
    assert res.peak_water_depth_m > 0.0
    assert res.peak_velocity_ms > 0.0
    assert len(res.time_steps) > 0

def test_reference_hydrodynamic_solver_sph():
    solver = ReferenceHydrodynamicSolver(nx=40, ny=30, dx=30.0, dy=30.0)
    sc_params = {
        "breach_width_m": 50.0,
        "breach_depth_m": 15.0,
        "reservoir_water_level_m": 25.0,
        "breach_formation_time_hr": 1.0,
        "simulation_duration_hr": 2.0,
        "scenario_type": "DAM_BREAK"
    }
    dam_info = {
        "latitude": 22.76,
        "longitude": 70.88,
        "capacity_mcm": 110.0,
        "manning_n": 0.035
    }
    res = solver.solve("sc-2", "sim-2", sc_params, dam_info, solver_flavor="DUALSPHYSICS_SPH")
    
    assert res.total_area_flooded_sqkm > 0.0
    assert "SPH" in res.solver_name

def test_delft3d_adapter_mdu_generation(tmp_path):
    adapter = Delft3DAdapter(str(tmp_path))
    sim_dirs = adapter.create_isolated_dir("test_sim_delft3d")
    sc_params = {
        "breach_width_m": 50.0,
        "breach_depth_m": 15.0,
        "reservoir_water_level_m": 25.0,
        "breach_formation_time_hr": 1.0,
        "simulation_duration_hr": 2.0
    }
    dam_info = {"capacity_mcm": 100.0, "manning_n": 0.035}
    mdu_path = adapter.prepare_configuration(sim_dirs, sc_params, dam_info)
    assert os.path.exists(mdu_path)
    with open(mdu_path, "r") as f:
        content = f.read()
    assert "D-Flow FM" in content
    assert "CFLMax" in content

def test_sph_adapter_xml_generation(tmp_path):
    adapter = SPHAdapter(str(tmp_path))
    sim_dirs = adapter.create_isolated_dir("test_sim_sph")
    sc_params = {
        "breach_width_m": 50.0,
        "breach_depth_m": 15.0,
        "reservoir_water_level_m": 25.0,
        "breach_formation_time_hr": 1.0,
        "simulation_duration_hr": 1.0
    }
    dam_info = {"height_m": 24.0}
    xml_path = adapter.prepare_configuration(sim_dirs, sc_params, dam_info)
    assert os.path.exists(xml_path)
    with open(xml_path, "r") as f:
        content = f.read()
    assert "<casedef>" in content
    assert "Wendland quintic" in content
