export interface Dam {
  id: string;
  name: string;
  river_id: string;
  latitude: number;
  longitude: number;
  height_m: number;
  crest_length_m: number;
  capacity_mcm: number;
  full_reservoir_level_m: number;
  current_water_level_m: number;
  spillway_capacity_cumec: number;
  dam_type: string;
  state: string;
  district: string;
  properties?: Record<string, any>;
  reservoir_geometry?: any;
}

export interface River {
  id: string;
  name: string;
  basin: string;
  average_slope: number;
  manning_n: number;
  length_km?: number;
  geometry: any;
  properties?: Record<string, any>;
}

export interface Scenario {
  id: string;
  dam_id: string;
  name: string;
  description?: string;
  scenario_type: 'DAM_BREAK' | 'RIVER_BLOCKAGE' | 'CONTROLLED_RELEASE' | 'OVERTOPPING';
  failure_mode: 'PIPING' | 'OVERTOPPING' | 'INSTANTANEOUS' | 'GRADUAL';
  reservoir_water_level_m: number;
  reservoir_level_pct: number;
  breach_width_m: number;
  breach_depth_m: number;
  breach_formation_time_hr: number;
  peak_discharge_cumec?: number;
  simulation_duration_hr: number;
  grid_resolution_m: number;
}

export interface Simulation {
  id: string;
  scenario_id: string;
  solver_type: 'DELFT3D_FM' | 'DUALSPHYSICS' | 'HYBRID_COMPARISON' | 'REFERENCE_SW_SPH';
  execution_mode: 'REAL_SIMULATION' | 'DEMO_REFERENCE';
  status: 'QUEUED' | 'VALIDATING' | 'PREPARING' | 'RUNNING_DELFT3D' | 'RUNNING_SPH' | 'PROCESSING' | 'GENERATING_FLOOD' | 'GENERATING_GIS' | 'RUNNING_IMPACT' | 'COMPLETED' | 'FAILED';
  progress_pct: number;
  current_stage: string;
  max_flood_extent_sqkm?: number;
  max_water_depth_m?: number;
  max_flow_velocity_ms?: number;
  min_arrival_time_min?: number;
  computation_time_seconds?: number;
  error_message?: string;
  logs_json?: Array<{ time?: string; stage?: string; message: string }>;
  created_at: string;
}

export interface RiskZone {
  id: string;
  simulation_id: string;
  risk_level: 'LEVEL_0_SAFE' | 'LEVEL_1_WARNING' | 'LEVEL_2_HIGH_RISK' | 'LEVEL_3_CRITICAL';
  min_arrival_time_min: number;
  max_depth_m: number;
  max_velocity_ms: number;
  area_sqkm: number;
  geometry: any;
}

export interface FloodZone {
  id: string;
  simulation_id: string;
  time_step_min: number;
  depth_min_m: number;
  depth_max_m: number;
  avg_velocity_ms: number;
  area_sqkm: number;
  geometry: any;
}

export interface ImpactRecord {
  id: string;
  simulation_id: string;
  exposed_buildings_count: number;
  exposed_roads_length_km: number;
  exposed_bridges_count: number;
  exposed_schools_count: number;
  exposed_hospitals_count: number;
  exposed_population_estimate: number;
  exposed_agriculture_sqkm: number;
  critical_facilities_list: Array<{
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    risk_tier: string;
    status: string;
  }>;
  exposure_by_risk_level: {
    level_3_critical_buildings: number;
    level_2_high_risk_buildings: number;
    level_1_warning_buildings: number;
  };
  summary_report: {
    status: string;
    methodology: string;
    disclaimer: string;
  };
}

export interface SolverComparison {
  simulation_id: string;
  delft3d_extent_sqkm: number;
  sph_extent_sqkm: number;
  delft3d_max_depth_m: number;
  sph_max_depth_m: number;
  delft3d_max_velocity_ms: number;
  sph_max_velocity_ms: number;
  metrics: Array<{
    metric_name: string;
    delft3d_value: number;
    sph_value: number;
    absolute_difference: number;
    relative_difference_pct: number;
    unit: string;
  }>;
  difference_summary: string;
}

export interface SatelliteValidation {
  id: string;
  simulation_id: string;
  platform: string;
  acquisition_time: string;
  product_id: string;
  observed_area_sqkm: number;
  iou_score: number;
  overlap_area_sqkm: number;
  overlap_pct?: number;
  false_positive_area_sqkm: number;
  false_negative_area_sqkm: number;
  validation_status: string;
  validation_report: {
    engine: string;
    gee_configured: boolean;
    notes: string;
    scientific_disclaimer: string;
  };
}

export interface Shelter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  capacity: number;
  current_occupancy: number;
  status: string;
  contact_phone?: string;
  address?: string;
  facilities: string[];
}

export interface EvacuationRoute {
  id: string;
  name: string;
  origin_area: string;
  destination_shelter_id?: string;
  geometry: any;
  length_km: number;
  safe_risk_level_capacity: string;
  road_type: string;
  status_note: string;
}

export interface Alert {
  id: string;
  simulation_id: string;
  risk_level: string;
  title: string;
  message: string;
  severity: string;
  expected_arrival_time_min?: number;
  nearest_shelter_name?: string;
  expires_at: string;
  created_at: string;
}

export interface SystemHealth {
  status: string;
  service: string;
  environment: string;
  database: string;
  solvers: {
    delft3d_fm: string;
    dualsphysics_sph: string;
    reference_hydrodynamic_engine: string;
  };
  satellite: {
    google_earth_engine: string;
  };
  storage: {
    storage_path: string;
    free_space_gb: number;
  };
}
