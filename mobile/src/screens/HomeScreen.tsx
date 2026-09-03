import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { offlineDB } from '../services/db';
import { MobileGeofenceEngine } from '../services/geofence';
import { notificationService } from '../services/notifications';
import { syncManager } from '../services/sync';
import { ActiveRiskAssessment, SyncStatus } from '../types';
import { Colors } from '../theme/colors';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [assessment, setAssessment] = useState<ActiveRiskAssessment | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(offlineDB.getSyncStatus());
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number }>({
    lat: 22.820,
    lon: 70.860, // Default Morbi low-lying floodplain point
  });

  const evaluateLocation = async (lat: number, lon: number) => {
    const polys = await offlineDB.getCachedRiskPolygons();
    const shelters = await offlineDB.getCachedShelters();
    const result = MobileGeofenceEngine.evaluateRisk(lat, lon, polys, shelters);
    setAssessment(result);

    if (result.risk_level === 'LEVEL_3_CRITICAL' || result.risk_level === 'LEVEL_2_HIGH_RISK') {
      notificationService.triggerLocalRiskAlert(
        result.risk_level,
        result.warning_title,
        result.warning_message
      );
    }
  };

  useEffect(() => {
    evaluateLocation(userLocation.lat, userLocation.lon);
    setSyncStatus(offlineDB.getSyncStatus());
  }, [userLocation]);

  const getRiskStyle = () => {
    switch (assessment?.risk_level) {
      case 'LEVEL_3_CRITICAL':
        return Colors.riskLevel3;
      case 'LEVEL_2_HIGH_RISK':
        return Colors.riskLevel2;
      case 'LEVEL_1_WARNING':
        return Colors.riskLevel1;
      default:
        return Colors.riskLevel0;
    }
  };

  const riskStyle = getRiskStyle();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Offline Cache & Sync Diagnostics Banner */}
      <TouchableOpacity
        style={styles.syncBanner}
        onPress={() => navigation.navigate('OfflineStatus')}
      >
        <View style={styles.syncRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: syncStatus.status_tier === 'CURRENT' ? Colors.success : Colors.warning },
            ]}
          />
          <Text style={styles.syncText}>
            LOCAL CACHE: <Text style={styles.bold}>{syncStatus.status_tier}</Text> • Age: {syncStatus.data_age_minutes}m
          </Text>
        </View>
        <Text style={styles.syncLink}>Diagnostics &gt;</Text>
      </TouchableOpacity>

      {/* 2. Hero Danger Status Radar Card */}
      <View style={[styles.heroCard, { backgroundColor: riskStyle.bg, borderColor: riskStyle.border }]}>
        <View style={styles.heroHeader}>
          <View style={[styles.badge, { backgroundColor: riskStyle.base }]}>
            <Text style={styles.badgeText}>{assessment?.risk_level.replace(/_/g, ' ') || 'SAFE'}</Text>
          </View>
          <Text style={styles.coordsTag}>22.820°N, 70.860°E</Text>
        </View>

        <Text style={styles.heroTitle}>{assessment?.warning_title || 'Location Protected'}</Text>
        <Text style={[styles.heroDesc, { color: riskStyle.text }]}>
          {assessment?.warning_message || 'Calculating location hydrodynamic profile...'}
        </Text>

        {assessment?.is_inside_danger_zone && (
          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Predicted Depth</Text>
              <Text style={styles.metricVal}>{assessment.max_depth_m} m</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Flow Velocity</Text>
              <Text style={styles.metricVal}>{assessment.max_velocity_ms} m/s</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Arrival Time</Text>
              <Text style={styles.metricVal}>{assessment.arrival_time_min} min</Text>
            </View>
          </View>
        )}
      </View>

      {/* 3. Nearest Emergency Relief Shelter Quick Card */}
      {assessment?.nearest_shelter && (
        <View style={styles.shelterCard}>
          <View style={styles.shelterTop}>
            <Text style={styles.sectionLabel}>RECOMMENDED RELIEF DESTINATION</Text>
            <Text style={styles.shelterDist}>~{assessment.nearest_shelter.distance_km || 1.4} km away</Text>
          </View>

          <Text style={styles.shelterName}>{assessment.nearest_shelter.name}</Text>
          <Text style={styles.shelterAddress}>{assessment.nearest_shelter.address}</Text>

          <View style={styles.shelterFooter}>
            <Text style={styles.shelterCap}>Capacity: {assessment.nearest_shelter.capacity} Persons</Text>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => navigation.navigate('Shelters')}
            >
              <Text style={styles.navBtnText}>View Route &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 4. Quick Action Grid (2x2 Glass Cards) */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Risk')}
        >
          <View style={styles.actionIconPill}>
            <Text style={styles.actionEmoji}>📡</Text>
          </View>
          <Text style={styles.actionBtnTitle}>GPS Risk Scanner</Text>
          <Text style={styles.actionBtnSub}>Point-in-Polygon Engine</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Map')}
        >
          <View style={styles.actionIconPill}>
            <Text style={styles.actionEmoji}>🗺️</Text>
          </View>
          <Text style={styles.actionBtnTitle}>Offline Flood Map</Text>
          <Text style={styles.actionBtnSub}>Cached Hazard Zones</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('EmergencyInfo')}
        >
          <View style={styles.actionIconPill}>
            <Text style={styles.actionEmoji}>🛡️</Text>
          </View>
          <Text style={styles.actionBtnTitle}>Emergency Guide</Text>
          <Text style={styles.actionBtnSub}>Lifesaving Protocols</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Alerts')}
        >
          <View style={styles.actionIconPill}>
            <Text style={styles.actionEmoji}>🔔</Text>
          </View>
          <Text style={styles.actionBtnTitle}>Active Broadcasts</Text>
          <Text style={styles.actionBtnSub}>Emergency Push Feed</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  bold: {
    color: Colors.textWhite,
    fontWeight: 'bold',
  },
  syncLink: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  heroCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  coordsTag: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textWhite,
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  metricVal: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  shelterCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    borderRadius: 20,
    gap: 6,
  },
  shelterTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  shelterDist: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: 'bold',
  },
  shelterName: {
    color: Colors.textWhite,
    fontSize: 15,
    fontWeight: 'bold',
  },
  shelterAddress: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  shelterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  shelterCap: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  navBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navBtnText: {
    color: '#070B14',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 4,
  },
  actionIconPill: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionEmoji: {
    fontSize: 16,
  },
  actionBtnTitle: {
    color: Colors.textWhite,
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionBtnSub: {
    color: Colors.textMuted,
    fontSize: 10,
  },
});
