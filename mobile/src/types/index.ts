export type RiskLevel = 'LEVEL_0_SAFE' | 'LEVEL_1_WARNING' | 'LEVEL_2_HIGH_RISK' | 'LEVEL_3_CRITICAL';

export interface CachedRiskPolygon {
  id: string;
  risk_level: RiskLevel;
  max_depth_m: number;
  max_velocity_ms: number;
  min_arrival_time_min: number;
  area_sqkm: number;
  geometry: any; // GeoJSON MultiPolygon or Polygon
}

export interface CachedShelter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  capacity: number;
  status: string;
  contact_phone?: string;
  address?: string;
  distance_km?: number;
}

export interface CachedRoute {
  id: string;
  name: string;
  geometry: any;
  length_km: number;
  safe_capacity: string;
  status_note: string;
}

export interface SyncStatus {
  last_synced_at: string | null;
  data_age_minutes: number;
  status_tier: 'CURRENT' | 'AGING' | 'STALE';
  network_state: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  cached_polygons_count: number;
}

export interface CitizenLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface ActiveRiskAssessment {
  risk_level: RiskLevel;
  max_depth_m: number;
  max_velocity_ms: number;
  arrival_time_min: number;
  nearest_shelter: CachedShelter | null;
  warning_title: string;
  warning_message: string;
  is_inside_danger_zone: boolean;
}
