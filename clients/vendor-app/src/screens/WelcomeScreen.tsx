import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const NAVY = '#0A1931';
const ORANGE = '#F97316';

const features = [
  { icon: '🦈', title: 'Universal QR Code', desc: 'One code for all merchants' },
  { icon: '⚡', title: 'Instant Rewards', desc: 'Earn & redeem automatically' },
  { icon: '🎁', title: 'Exclusive Deals', desc: 'Access member-only perks' },
];

export default function WelcomeScreen() {
  const { completeOnboarding } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <View style={styles.logoBox}>
            <Text style={styles.logoShark}>🦈</Text>
          </View>
          <Text style={styles.title}>✨ Welcome to SharkBand! ✨</Text>
          <Text style={styles.subtitle}>Start earning rewards at our merchants</Text>
        </View>

        <View style={styles.features}>
          {features.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={styles.featureIconBox}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <View style={styles.checkBadge}>
                <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => void completeOnboarding()}>
          <Text style={styles.btnText}>Let's Go! 🚀</Text>
        </TouchableOpacity>

        <Text style={styles.tagline}>Your universal loyalty wallet awaits</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  top: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  logoBox: { width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoShark: { fontSize: 44 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9CA3AF' },
  features: { paddingHorizontal: 24, gap: 12, flex: 1 },
  featureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  featureIconBox: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureIcon: { fontSize: 24 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: '#9CA3AF' },
  checkBadge: { width: 24, height: 24, backgroundColor: '#22C55E', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btn: { marginHorizontal: 24, marginTop: 32, height: 56, backgroundColor: ORANGE, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: ORANGE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tagline: { textAlign: 'center', color: '#6B7280', fontSize: 12, marginTop: 16 },
});
