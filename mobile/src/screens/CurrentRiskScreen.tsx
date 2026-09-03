import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { offlineDB } from '../services/db';
import { MobileGeofenceEngine } from '../services/geofence';
import { ActiveRiskAssessment } from '../types';
import { Colors } from '../theme/colors';

export const CurrentRiskScreen: React.FC = () => {
  const [testLocation, setTestLocation] = useState<{ name: string; lat: number; lon: number }>({
    name: 'Morbi Riverbank Ward (Darbar Gadh)',
    lat: 22.820,
    lon: 70.860,
  });

  const [assessment, setAssessment] = useState<ActiveRiskAssessment | null>(null);

  const presetLocations = [
    { name: '1. High Danger Zone (Level 3)', lat: 22.820, lon: 70.860, tag: 'CRITICAL' },
    { name: '2. High Risk Corridor (Level 2)', lat: 22.840, lon: 70.870, tag: 'HIGH RISK' },
    { name: '3. Warning Perimeter (Level 1)', lat: 22.860, lon: 70.880, tag: 'WARNING' },
    { name: '4. High Elevation Ridge (Safe Zone)', lat: 22.890, lon: 70.920, tag: 'SAFE' },
  ];

  const handleScanLocation = async (lat: number, lon: number, name: string) => {
    setTestLocation({ name, lat, lon });
    const polys = await offlineDB.getCachedRiskPolygons();
    const shelters = await offlineDB.getCachedShelters();
    const res = MobileGeofenceEngine.evaluateRisk(lat, lon, polys, shelters);
    setAssessment(res);
  };

  const getAssessmentStyle = () => {
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

  const resStyle = getAssessmentStyle();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Offline Geofence Risk Scanner</Text>
      <Text style={styles.subtitle}>
        Simulate GPS locations across the Morbi valley floodplain to verify offline Ray-Casting point-in-polygon risk evaluation.
      </Text>

      {/* Preset Location Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Simulated GPS Positions:</Text>
        <View style={styles.btnCol}>
          {presetLocations.map((loc, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.locBtn,
                testLocation.name === loc.name && styles.locBtnActive,
              ]}
              onPress={() => handleScanLocation(loc.lat, loc.lon, loc.name)}
            >
              <View style={styles.locBtnRow}>
                <Text style={styles.locBtnText}>{loc.name}</Text>
                <Text
                  style={[
                    styles.locTag,
                    {
                      color:
                        loc.tag === 'CRITICAL'
                          ? Colors.error
                          : loc.tag === 'HIGH RISK'
                          ? Colors.warning
                          : Colors.success,
                    },
                  ]}
                >
                  {loc.tag}
                </Text>
              </View>
              <Text style={styles.locBtnCoords}>{loc.lat}°N, {loc.lon}°E</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Assessment Output Card */}
      {assessment && (
        <View
          style={[
            styles.resultCard,
            { backgroundColor: resStyle.bg, borderColor: resStyle.border },
          ]}
        >
          <View style={styles.resHeader}>
            <View style={[styles.resBadge, { backgroundColor: resStyle.base }]}>
              <Text style={styles.resBadgeText}>{assessment.risk_level.replace(/_/g, ' ')}</Text>
            </View>
            <Text style={styles.hudTag}>PIP EVALUATED</Text>
          </View>

          <Text style={styles.resTitle}>{assessment.warning_title}</Text>
          <Text style={[styles.resDesc, { color: resStyle.text }]}>
            {assessment.warning_message}
          </Text>

          {assessment.is_inside_danger_zone && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Water Depth</Text>
                <Text style={styles.statVal}>{assessment.max_depth_m} m</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Flow Velocity</Text>
                <Text style={styles.statVal}>{assessment.max_velocity_ms} m/s</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Arrival Window</Text>
                <Text style={styles.statVal}>{assessment.arrival_time_min} min</Text>
              </View>
            </View>
          )}

          {assessment.nearest_shelter && (
            <View style={styles.shelterBox}>
              <Text style={styles.shelterHeader}>Nearest Relief Destination:</Text>
              <Text style={styles.shelterName}>{assessment.nearest_shelter.name}</Text>
              <Text style={styles.shelterDist}>Distance: ~{assessment.nearest_shelter.distance_km} km away</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 14 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.textWhite, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: Colors.textMuted, textTransform: 'uppercase' },
  btnCol: { gap: 8 },
  locBtn: {
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  locBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.cardElevated,
  },
  locBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locBtnText: { color: Colors.textWhite, fontSize: 13, fontWeight: 'bold' },
  locTag: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  locBtnCoords: { color: Colors.textMuted, fontSize: 10, marginTop: 4, fontFamily: 'monospace' },
  resultCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 10,
    marginTop: 6,
  },
  resHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resBadgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  hudTag: {
    color: Colors.textMuted,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  resTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.textWhite },
  resDesc: { fontSize: 12, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statBox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statLabel: { color: Colors.textSecondary, fontSize: 9, textTransform: 'uppercase', fontWeight: 'bold' },
  statVal: { color: Colors.textWhite, fontSize: 14, fontWeight: '900', marginTop: 2, fontFamily: 'monospace' },
  shelterBox: { backgroundColor: Colors.card, padding: 12, borderRadius: 14, marginTop: 4, borderWidth: 1, borderColor: Colors.cardBorder },
  shelterHeader: { color: Colors.textMuted, fontSize: 10, fontWeight: 'bold' },
  shelterName: { color: Colors.success, fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  shelterDist: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
});
