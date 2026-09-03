import { offlineDB } from './db';
import { SyncStatus } from '../types';

const BACKEND_URL = 'http://10.0.2.2:8000/api/v1'; // Android Emulator localhost or local IP

class SyncManager {
  private isSyncing: boolean = false;

  async synchronizeWithBackend(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) return { success: false, message: 'Sync already in progress.' };
    this.isSyncing = true;

    try {
      // 1. Fetch active simulations to get latest completed hydrodynamic flood products
      const simRes = await fetch(`${BACKEND_URL}/simulations`, { method: 'GET' });
      if (!simRes.ok) throw new Error(`HTTP ${simRes.status}`);

      const sims = await simRes.json();
      const latestSim = sims.find((s: any) => s.status === 'COMPLETED') || sims[0];

      if (!latestSim) {
        return { success: false, message: 'No completed simulation available on backend.' };
      }

      // 2. Fetch latest risk zones
      const rzRes = await fetch(`${BACKEND_URL}/flood-zones/risk-zones/${latestSim.id}`);
      if (!rzRes.ok) throw new Error('Failed to fetch risk zones');
      const rzData = await rzRes.json();

      // 3. Fetch shelters
      const shelterRes = await fetch(`${BACKEND_URL}/shelters`);
      const shelterData = shelterRes.ok ? await shelterRes.json() : [];

      // 4. Fetch routes
      const routeRes = await fetch(`${BACKEND_URL}/safe-routes`);
      const routeData = routeRes.ok ? await routeRes.json() : [];

      // 5. Atomic Update
      await offlineDB.updateRiskDataAtomic(rzData, shelterData, routeData);
      return { success: true, message: 'Geospatial risk zones successfully updated.' };
    } catch (err: any) {
      // Non-destructive fallback: keep previous valid offline cache!
      console.warn('Sync failed (offline or network error). Retaining cached data:', err.message);
      return {
        success: false,
        message: 'Network offline. Using verified cached risk zones.',
      };
    } finally {
      this.isSyncing = false;
    }
  }

  getSyncStatus(): SyncStatus {
    return offlineDB.getSyncStatus();
  }
}

export const syncManager = new SyncManager();
