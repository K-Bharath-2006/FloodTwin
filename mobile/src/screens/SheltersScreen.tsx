import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { offlineDB } from '../services/db';
import { CachedShelter, CachedRoute } from '../types';
import { Colors } from '../theme/colors';

export const SheltersScreen: React.FC = () => {
  const [shelters, setShelters] = useState<CachedShelter[]>([]);
  const [routes, setRoutes] = useState<CachedRoute[]>([]);

  useEffect(() => {
    offlineDB.getCachedShelters().then(setShelters);
    offlineDB.getCachedRoutes().then(setRoutes);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Relief Shelters &amp; Safe Corridors</Text>
      <Text style={styles.subtitle}>
        Offline verified emergency shelter locations and safe evacuation paths avoiding predicted inundation zones.
      </Text>

      {/* Shelters List */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Designated Community Shelters</Text>
        <View style={styles.list}>
          {shelters.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.shelterName}>{s.name}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{s.status}</Text>
                </View>
              </View>
              <Text style={styles.address}>{s.address}</Text>

              <View style={styles.detailsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillLabel}>Capacity:</Text>
                  <Text style={styles.statPillVal}>{s.capacity} People</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillLabel}>Elevation:</Text>
                  <Text style={styles.statPillVal}>{s.elevation_m}m MSL</Text>
                </View>
              </View>

              {s.contact_phone && (
                <View style={styles.phoneBox}>
                  <Text style={styles.phoneLabel}>Helpline:</Text>
                  <Text style={styles.phone}>{s.contact_phone}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Evacuation Corridors */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Safe Evacuation Corridors</Text>
        <View style={styles.list}>
          {routes.map((r) => (
            <View key={r.id} style={styles.routeCard}>
              <Text style={styles.routeName}>{r.name}</Text>
              <Text style={styles.routeNote}>{r.status_note}</Text>
              <View style={styles.routeFooter}>
                <Text style={styles.routeDist}>Clearance: {r.length_km} km</Text>
                <Text style={styles.routeCap}>{r.safe_capacity}</Text>
              </View>
            </View>
          ))}
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
  section: { gap: 8 },
  sectionHeader: { fontSize: 11, fontWeight: 'bold', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { gap: 10 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shelterName: { color: Colors.textWhite, fontSize: 15, fontWeight: 'bold', flex: 1 },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusText: { color: Colors.success, fontSize: 10, fontWeight: 'bold' },
  address: { color: Colors.textSecondary, fontSize: 12 },
  detailsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statPillLabel: { color: Colors.textMuted, fontSize: 10 },
  statPillVal: { color: Colors.textWhite, fontSize: 11, fontWeight: 'bold' },
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  phoneLabel: { color: Colors.textMuted, fontSize: 11 },
  phone: { color: Colors.primary, fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' },
  routeCard: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  routeName: { color: Colors.textWhite, fontSize: 13, fontWeight: 'bold' },
  routeNote: { color: Colors.textSecondary, fontSize: 11 },
  routeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  routeDist: { color: Colors.primary, fontSize: 11, fontWeight: 'bold' },
  routeCap: { color: Colors.success, fontSize: 10, fontWeight: 'bold' },
});
