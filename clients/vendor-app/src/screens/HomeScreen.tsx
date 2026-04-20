import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../api/customerService';

const NAVY = '#0A1931';
const ORANGE = '#F97316';
const MIN_REFRESH_MS = 30_000;

export default function HomeScreen() {
  const { user } = useAuth();
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(60);
  const [countdown, setCountdown] = useState(60);
  const [merchantCount, setMerchantCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback((seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
  }, []);

  const fetchQrToken = useCallback(async () => {
    try {
      setQrError(false);
      const res = await customerService.getQrToken();
      setQrPayload(res.data.qrPayload);
      if (res.data.refreshIntervalSec) {
        setRefreshIntervalSec(res.data.refreshIntervalSec);
        startCountdown(res.data.refreshIntervalSec);
      }
    } catch {
      setQrError(true);
    } finally {
      setQrLoading(false);
    }
  }, [startCountdown]);

  const fetchMemberships = useCallback(async () => {
    try {
      const res = await customerService.getMemberships();
      const memberships: Array<{ points_balance?: number }> = Array.isArray(res.data)
        ? res.data
        : res.data?.memberships ?? [];
      setMerchantCount(memberships.length);
      setTotalPoints(memberships.reduce((sum, m) => sum + (m.points_balance ?? 0), 0));
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchQrToken();
    fetchMemberships();
  }, [fetchQrToken, fetchMemberships]);

  useEffect(() => {
    const ms = Math.max(MIN_REFRESH_MS, Math.floor(refreshIntervalSec / 2) * 1000);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchQrToken();
    }, ms);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQrToken, refreshIntervalSec]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchQrToken(), fetchMemberships()]);
    setRefreshing(false);
  };

  const firstName = user?.full_name?.split(' ')[0] ?? user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingSmall}>Welcome back</Text>
          <Text style={styles.greetingName}>{firstName} 👋</Text>
        </View>

        {/* QR Wallet Card — no rotation per design spec */}
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardBrand}>
                <View style={styles.cardLogoBox}>
                  <Text style={styles.cardLogoEmoji}>🦈</Text>
                </View>
                <Text style={styles.cardBrandName}>SHARKBAND</Text>
              </View>
              {!qrLoading && !qrError && (
                <Text style={styles.cardTimer}>
                  Refreshes in {countdown}s
                </Text>
              )}
            </View>

            {/* QR Code area */}
            <View style={styles.qrSection}>
              {qrLoading ? (
                <ActivityIndicator color={NAVY} size="large" />
              ) : qrError ? (
                <View style={styles.qrError}>
                  <Text style={styles.qrErrorIcon}>⚠️</Text>
                  <Text style={styles.qrErrorText}>Couldn't load QR code</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={fetchQrToken}
                    accessibilityRole="button"
                  >
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : qrPayload ? (
                <QRCode value={qrPayload} size={200} backgroundColor="#fff" color={NAVY} />
              ) : (
                <View style={styles.qrError}>
                  <Text style={styles.qrErrorIcon}>📱</Text>
                  <Text style={styles.qrErrorText}>QR code loading...</Text>
                </View>
              )}
            </View>

            {/* Card Footer */}
            <View style={styles.cardFooter}>
              <View style={styles.cardFooterRow}>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatLabel}>ACTIVE CARDS</Text>
                  <Text style={styles.cardStatValue}>
                    {merchantCount} merchant{merchantCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatLabel}>TOTAL POINTS</Text>
                  <Text style={[styles.cardStatValue, { color: ORANGE }]}>
                    {totalPoints.toLocaleString()} pts
                  </Text>
                </View>
              </View>
              <View style={styles.cardHint}>
                <Text style={styles.cardHintIcon}>📲</Text>
                <Text style={styles.cardHintText}>Show this code to earn &amp; redeem rewards</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Manual refresh */}
        <TouchableOpacity
          onPress={fetchQrToken}
          style={styles.refreshBtn}
          accessibilityRole="button"
          accessibilityLabel="Refresh QR code"
        >
          <Text style={styles.refreshBtnText}>🔄 Refresh QR Code</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  greeting: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 4 },
  greetingSmall: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  greetingName: { fontSize: 26, fontWeight: '800', color: NAVY, letterSpacing: -0.5 },
  cardWrapper: { paddingHorizontal: 20, paddingVertical: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 12,
  },
  cardHeader: {
    backgroundColor: NAVY,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLogoEmoji: { fontSize: 18 },
  cardBrandName: { color: 'white', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  cardTimer: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '500' },
  qrSection: {
    backgroundColor: 'white',
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  qrError: { alignItems: 'center', gap: 8 },
  qrErrorIcon: { fontSize: 48 },
  qrErrorText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 4, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: NAVY, borderRadius: 10 },
  retryBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  cardFooter: { backgroundColor: NAVY },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  cardStat: { gap: 4 },
  cardStatLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardStatValue: { color: 'white', fontSize: 17, fontWeight: '800' },
  cardHint: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardHintIcon: { fontSize: 14 },
  cardHintText: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  refreshBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  refreshBtnText: { color: ORANGE, fontSize: 14, fontWeight: '600' },
});
