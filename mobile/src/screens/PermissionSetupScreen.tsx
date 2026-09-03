import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';

export const PermissionSetupScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>📍</Text>
        </View>

        <Text style={styles.title}>Location Permission Setup</Text>

        <Text style={styles.quote}>
          "Location is used strictly to provide real-time flood-risk warnings and detect when you are inside a predicted dam breach inundation zone."
        </Text>

        <View style={styles.points}>
          <View style={styles.pointRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.pointText}>Runs Ray-Casting point-in-polygon locally on-device.</Text>
          </View>
          <View style={styles.pointRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.pointText}>Fully functional offline during cellular grid collapse.</Text>
          </View>
          <View style={styles.pointRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.pointText}>Never continuously transmits or sells your location.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={onComplete}>
          <Text style={styles.btnText}>Enable Location Protection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 26,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.textWhite },
  quote: {
    fontSize: 13,
    color: Colors.cyanLight,
    lineHeight: 20,
    fontStyle: 'italic',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    padding: 12,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  points: { gap: 10, marginVertical: 4 },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  check: { color: Colors.success, fontSize: 13, fontWeight: 'bold' },
  pointText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, flex: 1 },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnText: { color: '#070B14', fontSize: 14, fontWeight: '900' },
});
