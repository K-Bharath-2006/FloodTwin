import os
import shutil
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from simulation.common import CommonSimulationResult

logger = logging.getLogger(__name__)

class BaseSimulationAdapter(ABC):
    """
    Abstract adapter for scientific hydrodynamic simulation solvers.
    Manages isolated directories, parameter validation, process monitoring,
    log capturing, and standardizing solver outputs.
    """

    def __init__(self, workspace_root: str):
        self.workspace_root = workspace_root
        os.makedirs(workspace_root, exist_ok=True)

    def create_isolated_dir(self, simulation_id: str) -> Dict[str, str]:
        """
        Creates clean, isolated directory structure for a single simulation run:
        simulation/{simulation_id}/
          input/
          output/
          logs/
          gis/
        """
        sim_dir = os.path.join(self.workspace_root, simulation_id)
        dirs = {
            "root": sim_dir,
            "input": os.path.join(sim_dir, "input"),
            "output": os.path.join(sim_dir, "output"),
            "logs": os.path.join(sim_dir, "logs"),
            "gis": os.path.join(sim_dir, "gis")
        }
        for path in dirs.values():
            os.makedirs(path, exist_ok=True)
        return dirs

    @abstractmethod
    def validate_inputs(self, scenario_params: Dict[str, Any], dam_info: Dict[str, Any]) -> bool:
        """Validates all hydrological, boundary, and geometry parameters."""
        pass

    @abstractmethod
    def prepare_configuration(self, sim_dirs: Dict[str, str], scenario_params: Dict[str, Any], dam_info: Dict[str, Any]) -> str:
        """Generates configuration files (MDU/XML/BC) required by solver."""
        pass

    @abstractmethod
    def execute_solver(self, sim_dirs: Dict[str, str], config_file: str, timeout_sec: int) -> Dict[str, Any]:
        """Executes the solver process with monitoring, timeout handling, and stdout/stderr capture."""
        pass

    @abstractmethod
    def parse_and_normalize(self, sim_dirs: Dict[str, str], scenario_id: str, simulation_id: str) -> CommonSimulationResult:
        """Parses raw solver outputs and normalizes into CommonSimulationResult."""
        pass

    def cleanup(self, sim_dirs: Dict[str, str], keep_outputs: bool = True):
        """Optionally cleans up intermediate files to conserve disk space."""
        if not keep_outputs and os.path.exists(sim_dirs["root"]):
            shutil.rmtree(sim_dirs["root"], ignore_errors=True)
