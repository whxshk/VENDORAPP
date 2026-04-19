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

// Refresh at half the server-issued interval, minimum 30 s
const MIN_REFRESH_MS = 30_000;

export default function HomeScreen() {
  const { user } = useAuth();
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState(false);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(60_000);
  const [merchantCount, setMerchantCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchQrToken = useCallback(async () => {
    try {
      setQrError(false);
      const res = await customerService.getQrToken();
      setQrPayload(res.data.qrPayload);
      if (res.data.refreshIntervalSec) {
        // Use half the server-issued TTL, no less than MIN_REFRESH_MS
        const half = Math.floor(res.data.refreshIntervalSec / 2) * 1000;
        setRefreshIntervalMs(Math.max(MIN_REFRESH_MS, half));
      }
    } catch {
      setQrError(true);
    } finally {
      setQrLoading(false);
    }
  }, []);

  const fetchMemberships = useCallback(async () => {
    try {
      const res = await customerService.getMemberships();
      const memberships: Array<{ points_balance?: number }> = Array.isArray(res.data)
        ? res.data
        : res.data?.memberships ?? [];
      setMerchantCount(memberships.length);
      setTotalPoints(memberships.reduce((sum, m) => sum + (m.points_balance ?? 0), 0));
    } catch {
      // Non-critical — stats remain at 0 until next refresh
    }
  }, []);

  useEffect(() => {
    fetchQrToken();
    fetchMemberships();
  }, [fetchQrToken, fetchMemberships]);

  // Re-start interval when refreshIntervalMs changes
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchQrToken, refreshIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQrToken, refreshIntervalMs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchQrToken(), fetchMemberships()]);
    setRefreshing(false);
  };

  const firstName =
    user?.full_name?.split(' ')[0] ?? user?.name?.split(' ')[0] ?? 'there';

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

        {/* Card */}
        <View style={styles.cardWrapper}>
          <View style={[styles.card, { transform: [{ rotate: '-3deg' }] }]}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardShark}>🦈</Text>
                <Text style={styles.cardBrand}>SHARKBAND</Text>
              </View>
            </View>

            {/* QR */}
            <View style={styles.qrSection}>
              {qrLoading ? (
                <ActivityIndicator color={NAVY} size="large" />
              ) : qrError ? (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrPlaceholderIcon}>⚠️</Text>
                  <Text style={styles.qrPlaceholderText}>Couldn't load QR code</Text>
                  <TouchableOpacity
                    style={styles.qrRetryBtn}
                    onPress={fetchQrToken}
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading QR code"
                  >
                    <Text style={styles.qrRetryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : qrPayload ? (
                <QRCode value={qrPayload} size={240} backgroundColor="#fff" color={NAVY} />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrPlaceholderIcon}>📱</Text>
                  <Text style={styles.qrPlaceholderText}>QR code loading...</Text>
                </View>
              )}
            </View>

            {/* Card footer */}
            <View style={styles.cardFooter}>
              <View style={styles.cardFooterStat}>
                <Text style={styles.cardStatLabel}>Active Cards</Text>
                <Text style={styles.cardStatValue}>
                  {merchantCount} merchant{merchantCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.cardFooterDivider} />
              <View style={styles.cardFooterStat}>
                <Text style={styles.cardStatLabel}>Total Points</Text>
                <Text style={styles.cardStatValue}>{totalPoints} pts</Text>
              </View>
            </View>

            <View style={styles.cardHint}>
              <Text style={styles.cardHintText}>
                📲  Show this QR code to earn &amp; redeem rewards
              </Text>
            </View>
          </View>
        </View>

        {/* Refresh hint */}
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
  scroll: { flexGrow: 1, paddingBottom: 24 },
  greeting: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  greetingSmall: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 },
  greetingName: { fontSize: 26, fontWeight: '800', color: NAVY, marginTop: 2 },
  cardWrapper: { paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 40, elevation: 12 },
  cardHeader: { backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardShark: { fontSize: 24 },
  cardBrand: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  qrSection: { backgroundColor: '#fff', padding: 24, alignItems: 'center', justifyContent: 'center', minHeight: 280 },
  qrPlaceholder: { alignItems: 'center', gap: 8 },
  qrPlaceholderIcon: { fontSize: 48 },
  qrPlaceholderText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  qrRetryBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: NAVY, borderRadius: 10 },
  qrRetryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cardFooter: { backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  cardFooterStat: { flex: 1, alignItems: 'center' },
  cardFooterDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  cardStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  cardStatValue: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  cardHint: { backgroundColor: NAVY, paddingHorizontal: 20, paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  cardHintText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' },
  refreshBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  refreshBtnText: { color: ORANGE, fontSize: 14, fontWeight: '600' },
});
