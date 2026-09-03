import { CachedRiskPolygon, CachedShelter, ActiveRiskAssessment, RiskLevel } from '../types';

/**
 * Mobile Point-in-Polygon (Ray-Casting) Geofence Engine.
 * Runs locally on the citizen's mobile device without requiring active internet connection.
 */
export class MobileGeofenceEngine {
  /**
   * Ray-casting algorithm to test if Point [x, y] is inside Polygon ring.
   * x = longitude, y = latitude
   */
  public static isPointInPolygon(point: [number, number], ring: number[][]): boolean {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Tests point against GeoJSON Polygon or MultiPolygon geometry.
   */
  public static testGeometry(point: [number, number], geometry: any): boolean {
    if (!geometry || !geometry.coordinates) return false;

    if (geometry.type === 'Polygon') {
      // Test outer ring
      return this.isPointInPolygon(point, geometry.coordinates[0]);
    } else if (geometry.type === 'MultiPolygon') {
      for (const poly of geometry.coordinates) {
        if (this.isPointInPolygon(point, poly[0])) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Calculates Haversine great-circle distance between two coordinates in kilometers.
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  /**
   * Evaluates citizen's GPS coordinates against cached hydrodynamic risk zones.
   */
  public static evaluateRisk(
    lat: number,
    lon: number,
    cachedPolygons: CachedRiskPolygon[],
    shelters: CachedShelter[]
  ): ActiveRiskAssessment {
    const pt: [number, number] = [lon, lat];

    // Find nearest shelter
    let nearestShelter: CachedShelter | null = null;
    let minDistance = 9999;
    for (const s of shelters) {
      const dist = this.calculateDistanceKm(lat, lon, s.latitude, s.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestShelter = { ...s, distance_km: dist };
      }
    }

    // 1. Check Level 3 Critical Polygons first (Highest Priority)
    const l3Polys = cachedPolygons.filter((p) => p.risk_level === 'LEVEL_3_CRITICAL');
    for (const poly of l3Polys) {
      if (this.testGeometry(pt, poly.geometry)) {
        return {
          risk_level: 'LEVEL_3_CRITICAL',
          max_depth_m: poly.max_depth_m,
          max_velocity_ms: poly.max_velocity_ms,
          arrival_time_min: poly.min_arrival_time_min,
          nearest_shelter: nearestShelter,
          warning_title: 'CRITICAL DAM FLOOD ALERT',
          warning_message: `You are inside a predicted Level 3 high-risk zone (Depth: ~${poly.max_depth_m}m). Evacuate immediately to ${nearestShelter?.name || 'higher ground'}.`,
          is_inside_danger_zone: true,
        };
      }
    }

    // 2. Check Level 2 High Risk Polygons
    const l2Polys = cachedPolygons.filter((p) => p.risk_level === 'LEVEL_2_HIGH_RISK');
    for (const poly of l2Polys) {
      if (this.testGeometry(pt, poly.geometry)) {
        return {
          risk_level: 'LEVEL_2_HIGH_RISK',
          max_depth_m: poly.max_depth_m,
          max_velocity_ms: poly.max_velocity_ms,
          arrival_time_min: poly.min_arrival_time_min,
          nearest_shelter: nearestShelter,
          warning_title: 'HIGH FLOOD RISK WARNING',
          warning_message: `High flood inundation predicted nearby (~${poly.max_depth_m}m). Prepare emergency supplies and follow designated evacuation corridors.`,
          is_inside_danger_zone: true,
        };
      }
    }

    // 3. Check Level 1 Warning Polygons
    const l1Polys = cachedPolygons.filter((p) => p.risk_level === 'LEVEL_1_WARNING');
    for (const poly of l1Polys) {
      if (this.testGeometry(pt, poly.geometry)) {
        return {
          risk_level: 'LEVEL_1_WARNING',
          max_depth_m: poly.max_depth_m,
          max_velocity_ms: poly.max_velocity_ms,
          arrival_time_min: poly.min_arrival_time_min,
          nearest_shelter: nearestShelter,
          warning_title: 'FLOOD WATCH & ADVISORY',
          warning_message: 'Flood risk detected in downstream floodplain. Avoid low-lying riverbanks and stay alert.',
          is_inside_danger_zone: true,
        };
      }
    }

    // 4. Safe Zone
    return {
      risk_level: 'LEVEL_0_SAFE',
      max_depth_m: 0.0,
      max_velocity_ms: 0.0,
      arrival_time_min: 0.0,
      nearest_shelter: nearestShelter,
      warning_title: 'SAFE LOCATION',
      warning_message: 'Your current location is outside the predicted dam breach inundation zones.',
      is_inside_danger_zone: false,
    };
  }
}
