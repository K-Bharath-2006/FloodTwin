import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { offlineDB } from '../services/db';
import { Colors } from '../theme/colors';

export const FloodMapScreen: React.FC = () => {
  const sync = offlineDB.getSyncStatus();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Offline Hydrodynamic Map</Text>
      <Text style={styles.subtitle}>
        Geospatial hazard boundaries stored in local SQLite storage. Evaluates Ray-Casting geofencing with 0 internet connectivity.
      </Text>

      {/* Visual representation of cached spatial polygons */}
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Morbi Valley River Corridor</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{sync.cached_polygons_count} Cached Polygons</Text>
          </View>
        </View>

        {/* Visual Map Canvas / Corridor Blueprint */}
        <View style={styles.mapCanvas}>
          <View style={styles.damMarker}>
            <Text style={styles.damText}>DAM: Machhu-II (22.79°N)</Text>
          </View>

          {/* Visual Layer Representation */}
          <View style={styles.polygonVisualContainer}>
            <View style={[styles.zoneBox, { backgroundColor: Colors.riskLevel3.bg, borderColor: Colors.riskLevel3.base }]}>
              <View style={styles.zoneHeader}>
                <Text style={[styles.zoneText, { color: Colors.riskLevel3.text }]}>
                  🔴 Level 3: Critical Danger Core
                </Text>
                <Text style={styles.zoneMetric}>Depth &gt; 1.5m</Text>
              </View>
              <Text style={styles.zoneSub}>Darbar Gadh • Nazarbaug Lowlands • Immediate Evacuation</Text>
            </View>

            <View style={[styles.zoneBox, { backgroundColor: Colors.riskLevel2.bg, borderColor: Colors.riskLevel2.base }]}>
              <View style={styles.zoneHeader}>
                <Text style={[styles.zoneText, { color: Colors.riskLevel2.text }]}>
                  🟠 Level 2: High Risk Spread
                </Text>
                <Text style={styles.zoneMetric}>Depth 0.5 - 1.5m</Text>
              </View>
              <Text style={styles.zoneSub}>Morbi Station Road Corridor • Move to High Ground</Text>
            </View>

            <View style={[styles.zoneBox, { backgroundColor: Colors.riskLevel1.bg, borderColor: Colors.riskLevel1.base }]}>
              <View style={styles.zoneHeader}>
                <Text style={[styles.zoneText, { color: Colors.riskLevel1.text }]}>
                  🟡 Level 1: Warning Perimeter
                </Text>
                <Text style={styles.zoneMetric}>Depth 0.1 - 0.5m</Text>
              </View>
              <Text style={styles.zoneSub}>Outer Agricultural Buffer Zone</Text>
            </View>

            <View style={[styles.zoneBox, { backgroundColor: Colors.riskLevel0.bg, borderColor: Colors.riskLevel0.base }]}>
              <View style={styles.zoneHeader}>
                <Text style={[styles.zoneText, { color: Colors.riskLevel0.text }]}>
                  🟢 Level 0: Safe High Ground
                </Text>
                <Text style={styles.zoneMetric}>Elevated</Text>
              </View>
              <Text style={styles.zoneSub}>Morbi High Ridge • Community Assembly Areas</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapFooter}>
          <Text style={styles.footerText}>CRS: EPSG:4326 (WGS84) • SQLite Spatial Vector Store</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 14 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.textWhite, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  mapCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 22,
    overflow: 'hidden',
    gap: 12,
    padding: 16,
  },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapTitle: { color: Colors.textWhite, fontSize: 14, fontWeight: 'bold' },
  badgePill: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  badgeText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold' },
  mapCanvas: {
    backgroundColor: '#050811',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  damMarker: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
  },
  damText: { color: Colors.cyanLight, fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' },
  polygonVisualContainer: { gap: 8 },
  zoneBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 2,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneText: { fontSize: 12, fontWeight: 'bold' },
  zoneMetric: { color: Colors.textWhite, fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' },
  zoneSub: { color: Colors.textSecondary, fontSize: 10, marginTop: 2 },
  mapFooter: { borderTopWidth: 1, borderTopColor: Colors.cardBorder, paddingTop: 8 },
  footerText: { color: Colors.textMuted, fontSize: 10, fontFamily: 'monospace' },
});
