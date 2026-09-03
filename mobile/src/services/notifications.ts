import { RiskLevel } from '../types';

class NotificationService {
  private lastAlertRiskLevel: RiskLevel | null = null;
  private lastAlertTimestamp: number = 0;
  private cooldownMs: number = 300000; // 5 minutes cooldown for same zone

  /**
   * Triggers local emergency alert notification when entering higher risk tier
   * or when cooldown expires.
   */
  async triggerLocalRiskAlert(riskLevel: RiskLevel, title: string, body: string): Promise<boolean> {
    const now = Date.now();

    // Deduplication / Cooldown check:
    // Only suppress if EXACT same risk level and within cooldown period
    if (
      this.lastAlertRiskLevel === riskLevel &&
      now - this.lastAlertTimestamp < this.cooldownMs
    ) {
      return false; // Suppressed due to cooldown
    }

    this.lastAlertRiskLevel = riskLevel;
    this.lastAlertTimestamp = now;

    console.log(`[LOCAL NOTIFICATION DISPATCHED] Tier: ${riskLevel} | Title: ${title}`);
    return true;
  }

  resetCooldown() {
    this.lastAlertRiskLevel = null;
    this.lastAlertTimestamp = 0;
  }
}

export const notificationService = new NotificationService();
