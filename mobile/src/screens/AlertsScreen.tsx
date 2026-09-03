import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';

export const AlertsScreen: React.FC = () => {
  const mockAlerts = [
    {
      id: 'ALT-01',
      title: 'CRITICAL DAM INUNDATION ALERT',
      severity: 'CRITICAL',
      message: 'Hydrodynamic dam-break surge wave progressing downstream. Depth exceeds 1.5m in Darbar Gadh riverfront ward. Evacuate immediately.',
      time: '10 mins ago',
      shelter: 'Morbi Town Hall Relief Shelter',
      arrival: '15 min',
    },
    {
      id: 'ALT-02',
      title: 'HIGH RISK ADVISORY: MORBI BYPASS',
      severity: 'HIGH',
      message: 'Predicted water depth ~1.2m along station road. Avoid low-lying underpasses and use designated elevated routes.',
      time: '25 mins ago',
      shelter: 'VC Technical High School',
      arrival: '35 min',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Emergency Broadcasts Feed</Text>
      <Text style={styles.subtitle}>
        Official NDMA / CWC disaster management early warnings and offline geofence push notifications.
      </Text>

      <View style={styles.list}>
        {mockAlerts.map((al) => {
          const isCrit = al.severity === 'CRITICAL';
          const alertStyle = isCrit ? Colors.riskLevel3 : Colors.riskLevel2;

          return (
            <View
              key={al.id}
              style={[
                styles.card,
                { backgroundColor: alertStyle.bg, borderColor: alertStyle.border },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.badge, { backgroundColor: alertStyle.base }]}>
                  <Text style={styles.badgeText}>{al.severity}</Text>
                </View>
                <Text style={styles.time}>{al.time}</Text>
              </View>

              <Text style={styles.cardTitle}>{al.title}</Text>
              <Text style={[styles.cardMsg, { color: alertStyle.text }]}>{al.message}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>
                  Evacuate To: <Text style={styles.bold}>{al.shelter}</Text>
                </Text>
                <Text style={styles.arrivalTag}>Est: {al.arrival}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 14 },
  title: { fontSize: 18, fontWeight: '900', color: Colors.textWhite, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  list: { gap: 12 },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: Colors.textWhite, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  time: { color: Colors.textMuted, fontSize: 11, fontFamily: 'monospace' },
  cardTitle: { color: Colors.textWhite, fontSize: 15, fontWeight: 'bold' },
  cardMsg: { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
    marginTop: 4,
  },
  footerText: { color: Colors.textSecondary, fontSize: 11 },
  bold: { color: Colors.textWhite, fontWeight: 'bold' },
  arrivalTag: { color: Colors.primary, fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' },
});
