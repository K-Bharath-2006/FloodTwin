import { CachedRiskPolygon, CachedShelter, CachedRoute, SyncStatus } from '../types';

/**
 * Mobile Offline Storage Layer (SQLite / Secure Cache).
 * Stores hydrodynamic risk polygons, shelters, and evacuation corridors locally
 * for zero-connectivity point-in-polygon danger evaluation.
 */
class OfflineDatabase {
  private riskPolygons: CachedRiskPolygon[] = [];
  private shelters: CachedShelter[] = [];
  private routes: CachedRoute[] = [];
  private lastSyncTimestamp: string | null = null;

  constructor() {
    this.seedDefaultDemoCache();
  }

  private seedDefaultDemoCache() {
    this.lastSyncTimestamp = new Date().toISOString();
    // Default cached Machhu-II risk polygons for instant offline capability
    this.riskPolygons = [
      {
        id: 'CACHED-RZ-L3',
        risk_level: 'LEVEL_3_CRITICAL',
        max_depth_m: 8.5,
        max_velocity_ms: 5.2,
        min_arrival_time_min: 15.0,
        area_sqkm: 5.2,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [70.850, 22.800],
              [70.875, 22.800],
              [70.875, 22.835],
              [70.850, 22.835],
              [70.850, 22.800],
            ],
          ],
        },
      },
      {
        id: 'CACHED-RZ-L2',
        risk_level: 'LEVEL_2_HIGH_RISK',
        max_depth_m: 1.4,
        max_velocity_ms: 2.1,
        min_arrival_time_min: 35.0,
        area_sqkm: 7.8,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [70.835, 22.780],
              [70.890, 22.780],
              [70.890, 22.855],
              [70.835, 22.855],
              [70.835, 22.780],
            ],
          ],
        },
      },
      {
        id: 'CACHED-RZ-L1',
        risk_level: 'LEVEL_1_WARNING',
        max_depth_m: 0.45,
        max_velocity_ms: 0.8,
        min_arrival_time_min: 60.0,
        area_sqkm: 5.45,
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [70.820, 22.760],
              [70.910, 22.760],
              [70.910, 22.875],
              [70.820, 22.875],
              [70.820, 22.760],
            ],
          ],
        },
      },
    ];

    this.shelters = [
      {
        id: 'SHELTER-01',
        name: 'Morbi Town Hall Relief Shelter',
        latitude: 22.8250,
        longitude: 70.8350,
        elevation_m: 62.0,
        capacity: 1500,
        status: 'OPERATIONAL',
        contact_phone: '+91-2822-220100',
        address: 'Near Circuit House, High Elevation Ridge, Morbi',
      },
      {
        id: 'SHELTER-02',
        name: 'VC Technical High School Shelter',
        latitude: 22.8150,
        longitude: 70.8200,
        elevation_m: 58.5,
        capacity: 800,
        status: 'OPERATIONAL',
        contact_phone: '+91-2822-220105',
        address: 'Station Road, Higher Ground, Morbi',
      },
      {
        id: 'SHELTER-03',
        name: 'APMC Community Center',
        latitude: 22.8400,
        longitude: 70.8100,
        elevation_m: 65.0,
        capacity: 2000,
        status: 'OPERATIONAL',
        contact_phone: '+91-2822-220110',
        address: 'Sanala Road Bypass, Morbi',
      },
    ];

    this.routes = [
      {
        id: 'RT-01',
        name: 'Darbar Gadh Riverfront to Town Hall Shelter',
        geometry: {
          type: 'LineString',
          coordinates: [
            [70.8600, 22.8200],
            [70.8500, 22.8220],
            [70.8350, 22.8250],
          ],
        },
        length_km: 2.8,
        safe_capacity: 'Grade-A Elevated Paved Arterial',
        status_note: 'Suggested route — elevated clearance above Level 3 flood zone.',
      },
    ];
  }

  async getCachedRiskPolygons(): Promise<CachedRiskPolygon[]> {
    return this.riskPolygons;
  }

  async getCachedShelters(): Promise<CachedShelter[]> {
    return this.shelters;
  }

  async getCachedRoutes(): Promise<CachedRoute[]> {
    return this.routes;
  }

  async updateRiskDataAtomic(
    newPolygons: CachedRiskPolygon[],
    newShelters?: CachedShelter[],
    newRoutes?: CachedRoute[]
  ): Promise<boolean> {
    if (!newPolygons || newPolygons.length === 0) return false;
    this.riskPolygons = newPolygons;
    if (newShelters) this.shelters = newShelters;
    if (newRoutes) this.routes = newRoutes;
    this.lastSyncTimestamp = new Date().toISOString();
    return true;
  }

  getSyncStatus(): SyncStatus {
    const now = new Date().getTime();
    const lastSync = this.lastSyncTimestamp ? new Date(this.lastSyncTimestamp).getTime() : now;
    const diffMinutes = Math.floor((now - lastSync) / (1000 * 60));

    let tier: 'CURRENT' | 'AGING' | 'STALE' = 'CURRENT';
    if (diffMinutes > 120) tier = 'STALE';
    else if (diffMinutes > 30) tier = 'AGING';

    return {
      last_synced_at: this.lastSyncTimestamp,
      data_age_minutes: diffMinutes,
      status_tier: tier,
      network_state: 'ONLINE',
      cached_polygons_count: this.riskPolygons.length,
    };
  }
}

export const offlineDB = new OfflineDatabase();
