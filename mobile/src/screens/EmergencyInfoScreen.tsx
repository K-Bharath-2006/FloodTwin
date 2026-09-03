import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';

export const EmergencyInfoScreen: React.FC = () => {
  const safetyRules = [
    {
      num: '01',
      title: 'Immediate Evacuation to High Elevation',
      desc: 'When a Level 2 or Level 3 Critical Alert is triggered, do not wait for water to become visible. Move immediately to higher elevation ridges (>55m MSL) or designated community shelters.',
    },
    {
      num: '02',
      title: 'Water Depth & Velocity Hazards',
      desc: '• 15 cm (6 in): Moving water can knock down an adult.\n• 30 cm (1 ft): Water sweeps away sedans & light vehicles.\n• 60 cm (2 ft): Rapid scour destroys bridge piers & structures.',
    },
    {
      num: '03',
      title: 'Follow Designated Safe Corridors',
      desc: 'Stick strictly to verified arterial bypass corridors. Never cross low-lying causeways or riverbed dips during surge wave propagation.',
    },
    {
      num: '04',
      title: 'Emergency Contact Helplines',
      desc: '• State Emergency Operations Center (SEOC): 1070\n• District Emergency Center (Morbi): 1077\n• National Disaster Response Force (NDRF): 011-24363260\n• Police & Rescue Control: 112',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lifesaving Flood Protocols</Text>
      <Text style={styles.subtitle}>
        Critical hydrodynamic safety rules and emergency helplines during rapid dam breach wave events.
      </Text>

      <View style={styles.list}>
        {safetyRules.map((rule, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.numBadge}>
                <Text style={styles.numText}>{rule.num}</Text>
              </View>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
            </View>
            <Text style={styles.ruleDesc}>{rule.desc}</Text>
          </View>
        ))}
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
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: Colors.primary, fontSize: 12, fontWeight: '900', fontFamily: 'monospace' },
  ruleTitle: { color: Colors.textWhite, fontSize: 14, fontWeight: 'bold', flex: 1 },
  ruleDesc: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
