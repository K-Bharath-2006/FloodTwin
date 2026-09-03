import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { offlineDB } from '../services/db';
import { syncManager } from '../services/sync';
import { SyncStatus } from '../types';
import { Colors } from '../theme/colors';

export const OfflineStatusScreen: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineDB.getSyncStatus());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    const res = await syncManager.synchronizeWithBackend();
    setSyncStatus(offlineDB.getSyncStatus());
    setSyncMessage(res.message);
    setIsSyncing(false);
  };

  const isStale = syncStatus.status_tier === 'STALE';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Offline Diagnostics &amp; Sync Engine</Text>
      <Text style={styles.subtitle}>
        Geospatial risk data status, local cache integrity, and backend communication synchronization.
      </Text>

      {/* Stale Warning Banner */}
      {isStale && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningTitle}>⚠️ Stale Flood-Risk Data Notice</Text>
          <Text style={styles.warningDesc}>
            Flood-risk information may be outdated (Data age &gt; 2 hours). GPS only detects position against cached predictions; reconnect to internet when available to update zones.
          </Text>
        </View>
      )}

      {/* Status Panel */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Network Telemetry</Text>
          <Text style={styles.valOnline}>{syncStatus.network_state}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Cache Age</Text>
          <Text style={styles.val}>{syncStatus.data_age_minutes} minutes old</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Data Status Tier</Text>
          <Text style={[styles.tierBadge, { color: syncStatus.status_tier === 'CURRENT' ? Colors.success : Colors.warning }]}>
            {syncStatus.status_tier}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Last Synchronized</Text>
          <Text style={styles.valMono}>
            {syncStatus.last_synced_at ? new Date(syncStatus.last_synced_at).toLocaleTimeString() : 'Initial Setup'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Cached Risk Polygons</Text>
          <Text style={styles.val}>{syncStatus.cached_polygons_count} Polygons (SQLite)</Text>
        </View>
      </View>

      {/* Sync Action Button */}
      <TouchableOpacity
        style={[styles.syncBtn, isSyncing && styles.syncBtnDisabled]}
        onPress={handleManualSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator color="#070B14" />
        ) : (
          <Text style={styles.syncBtnText}>Synchronize with Simulation Cloud</Text>
        )}
      </TouchableOpacity>

      {syncMessage && (
        <View style={styles.msgBox}>
          <Text style={styles.msgText}>{syncMessage}</Text>
        </View>
      )}

      {/* Scientific Principle Explanation */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Architectural Principle:</Text>
        <Text style={styles.infoDesc}>
          GPS determines your physical position; hydrodynamic simulation determines the flood threat. The mobile client runs a native Ray-Casting algorithm locally against cached simulation geometries to ensure alerts fire even with complete cellular grid outage.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 14 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.textWhite, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  warningBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: Colors.error,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  warningTitle: { color: Colors.error, fontSize: 13, fontWeight: 'bold' },
  warningDesc: { color: Colors.riskLevel3.text, fontSize: 11, lineHeight: 16 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: Colors.textSecondary, fontSize: 12 },
  val: { color: Colors.textWhite, fontSize: 13, fontWeight: 'bold' },
  valOnline: { color: Colors.success, fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace' },
  valMono: { color: Colors.primary, fontSize: 12, fontFamily: 'monospace' },
  tierBadge: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  syncBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncBtnText: { color: '#070B14', fontSize: 14, fontWeight: '900' },
  msgBox: {
    backgroundColor: Colors.cardElevated,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  msgText: { color: Colors.textPrimary, fontSize: 12, textAlign: 'center' },
  infoBox: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 4,
  },
  infoTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  infoDesc: { color: Colors.textSecondary, fontSize: 11, lineHeight: 16 },
});
