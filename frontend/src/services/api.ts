import {
  Dam, River, Scenario, Simulation, RiskZone, FloodZone, ImpactRecord,
  SolverComparison, SatelliteValidation, Shelter, EvacuationRoute, Alert, SystemHealth
} from '../types';

const API_BASE = '/api/v1';

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API request failed');
  }
  return res.json();
}

export const api = {
  // Dams & Rivers
  getDams: () => fetchJSON<Dam[]>('/dams'),
  getDam: (id: string) => fetchJSON<Dam>(`/dams/${id}`),
  getRivers: () => fetchJSON<River[]>('/rivers'),

  // Datasets
  getDatasets: () => fetchJSON<any[]>('/datasets'),

  // Scenarios
  getScenarios: (damId?: string) => fetchJSON<Scenario[]>(damId ? `/scenarios?dam_id=${damId}` : '/scenarios'),
  getScenario: (id: string) => fetchJSON<Scenario>(`/scenarios/${id}`),
  createScenario: (data: Partial<Scenario>) => fetchJSON<Scenario>('/scenarios', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  compareScenarios: (ids?: string[]) => fetchJSON<any[]>(ids ? `/scenarios/compare?scenario_ids=${ids.join(',')}` : '/scenarios/compare'),

  // Simulations
  getSimulations: () => fetchJSON<Simulation[]>('/simulations'),
  getSimulation: (id: string) => fetchJSON<Simulation>(`/simulations/${id}`),
  getSimulationStatus: (id: string) => fetchJSON<Simulation>(`/simulations/${id}/status`),
  getSimulationResults: (id: string) => fetchJSON<any>(`/simulations/${id}/results`),
  getSimulationComparison: (id: string) => fetchJSON<SolverComparison>(`/simulations/${id}/comparison`),
  queueSimulation: (data: { scenario_id: string; solver_type: string; execution_mode: string }) =>
    fetchJSON<Simulation>('/simulations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Flood & Risk Zones
  getFloodZones: (simId: string) => fetchJSON<FloodZone[]>(`/flood-zones/simulation/${simId}`),
  getRiskZones: (simId: string) => fetchJSON<RiskZone[]>(`/flood-zones/risk-zones/${simId}`),

  // Impact
  getImpactRecord: (simId: string) => fetchJSON<ImpactRecord>(`/impacts/${simId}`),

  // GIS Exports URL helpers
  getShpExportUrl: (simId: string) => `${API_BASE}/exports/${simId}/shp`,
  getKmlExportUrl: (simId: string) => `${API_BASE}/exports/${simId}/kml`,
  getGeoJsonExportUrl: (simId: string) => `${API_BASE}/exports/${simId}/geojson`,

  // GEE Satellite Validation
  getSatelliteValidation: (simId: string) => fetchJSON<SatelliteValidation>(`/ge/validation/${simId}`),
  getReverseMatch: () => fetchJSON<any>('/ge/reverse-match', { method: 'POST' }),

  // Shelters & Routes
  getShelters: () => fetchJSON<Shelter[]>('/shelters'),
  getSafeRoutes: () => fetchJSON<EvacuationRoute[]>('/safe-routes'),

  // Alerts
  getAlerts: () => fetchJSON<Alert[]>('/alerts'),
  dispatchTestAlert: (simId: string) => fetchJSON<Alert>('/alerts/test', {
    method: 'POST',
    body: JSON.stringify({ simulation_id: simId, risk_level: 'LEVEL_3_CRITICAL' }),
  }),

  // System Health
  getHealth: () => fetchJSON<SystemHealth>('/health'),
};
