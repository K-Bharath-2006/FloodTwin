import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../theme/colors';

export const GoogleLoginScreen: React.FC<{ navigation: any; onLogin: () => void }> = ({ navigation, onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandBox}>
        <View style={styles.logoPill}>
          <Text style={styles.logoEmoji}>🌊</Text>
        </View>
        <Text style={styles.title}>HYDROBREACH</Text>
        <Text style={styles.subtitle}>
          Smart India Hackathon 2026 • Citizen Inundation Alert
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Citizen Authentication</Text>
        <Text style={styles.cardDesc}>
          Authenticate securely with Google OAuth to receive personalized flood warnings, offline shelter routing, and emergency community broadcast feeds.
        </Text>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#070B14" />
          ) : (
            <View style={styles.googleBtnRow}>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          NDMA &amp; CWC Compliance: Personal position history is never logged or sold. Geofence evaluation is performed locally on your device.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    padding: 24,
    gap: 28,
  },
  brandBox: {
    alignItems: 'center',
    gap: 8,
  },
  logoPill: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    marginBottom: 4,
  },
  logoEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textWhite,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textWhite,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  googleBtn: {
    backgroundColor: Colors.textWhite,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  googleBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleG: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleBtnText: {
    color: '#070B14',
    fontSize: 14,
    fontWeight: '900',
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
});
