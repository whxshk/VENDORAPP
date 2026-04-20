import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../api/customerService';
import { SearchIcon, ChevronRightIcon, StarIcon } from '../components/Icons';

const NAVY = '#0A1931';
const ORANGE = '#F97316';

const CATEGORY_FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'café',       label: 'Café' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'grocery',    label: 'Grocery' },
  { key: 'fitness',    label: 'Fitness' },
  { key: 'retail',     label: 'Retail' },
];

// Deterministic rich color per merchant — no generic gray boxes
const MERCHANT_COLORS = [
  '#1e3a5f', '#3b1f0d', '#0d2b1a', '#1a0d2b',
  '#2b0d1a', '#1a2b0d', '#0d1a2b', '#2b1a0d',
];
function merchantColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return MERCHANT_COLORS[Math.abs(hash) % MERCHANT_COLORS.length];
}

interface Membership {
  merchant_name?: string;
  merchant_category?: string;
  loyalty_type?: string;
  points_balance?: number;
  stamps_balance?: number;
  stamps_target?: number;
  stamps_max?: number;
}

function StampProgress({ current, max }: { current: number; max: number }) {
  const pct = Math.round((current / max) * 100);
  const toGo = max - current;
  if (max <= 10) {
    return (
      <View style={styles.stampDots}>
        {Array.from({ length: max }).map((_, i) => (
          <View
            key={i}
            style={[styles.stampDot, i < current ? styles.stampDotFilled : styles.stampDotEmpty]}
          />
        ))}
        <Text style={styles.stampDotCount}>{current}/{max}</Text>
      </View>
    );
  }
  return (
    <View style={styles.stampBar}>
      <View style={styles.stampBarHeader}>
        <Text style={styles.stampBarLabel}>{current}/{max} stamps</Text>
        <Text style={styles.stampBarToGo}>{toGo} to go</Text>
      </View>
      <View style={styles.stampBarTrack}>
        <View style={[styles.stampBarFill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

function MerchantCard({ m }: { m: Membership }) {
  const name = m.merchant_name ?? 'Merchant';
  const category = m.merchant_category ?? '';
  const isStamps = m.loyalty_type === 'stamps' || m.stamps_balance !== undefined;
  const pts = m.points_balance ?? 0;
  const stamps = m.stamps_balance ?? 0;
  const stampsMax = m.stamps_target ?? m.stamps_max ?? 10;
  const color = merchantColor(name);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={[styles.merchantAvatar, { backgroundColor: color }]}>
        <Text style={styles.merchantInitial}>{name[0].toUpperCase()}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.merchantName} numberOfLines={1}>{name}</Text>
        <Text style={styles.merchantCat}>{category || 'Loyalty Card'}</Text>

        {isStamps && stampsMax > 0 && (
          <StampProgress current={stamps} max={stampsMax} />
        )}

        {pts > 0 && (
          <View style={styles.ptsBadge}>
            <StarIcon color="#f59e0b" size={11} />
            <Text style={styles.ptsText}>{pts.toLocaleString()} pts</Text>
          </View>
        )}
      </View>
      <ChevronRightIcon color="#D1D5DB" size={16} />
    </TouchableOpacity>
  );
}

export default function WalletScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: memberships = [], isLoading } = useQuery<Membership[]>({
    queryKey: ['memberships', user?.userId],
    queryFn: async () => {
      const res = await customerService.getMemberships();
      return Array.isArray(res.data) ? res.data : (res.data?.memberships ?? []);
    },
    enabled: !!user,
  });

  const filtered = memberships.filter((m) => {
    const matchSearch = !search || m.merchant_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || m.merchant_category?.toLowerCase() === filter;
    return matchSearch && matchFilter;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['memberships'] });
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
        <Text style={styles.subtitle}>Your loyalty cards in one place</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <SearchIcon color="#9CA3AF" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search merchants..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORY_FILTERS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.filterChip, filter === c.key && styles.filterChipActive]}
              onPress={() => setFilter(c.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === c.key }}
            >
              <Text style={[styles.filterChipLabel, filter === c.key && styles.filterChipLabelActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />
          }
          renderItem={({ item }) => <MerchantCard m={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No loyalty cards yet</Text>
              <Text style={styles.emptyDesc}>
                Visit a SharkBand merchant and scan your QR code to start collecting points!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: 'white',
    paddingTop: 24,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 24, fontWeight: '800', color: NAVY, letterSpacing: -0.5, paddingHorizontal: 24 },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 3, paddingHorizontal: 24 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 12,
    paddingRight: 8,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', height: 44 },
  searchClear: { color: '#9CA3AF', fontSize: 14, padding: 4 },
  filterRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 7 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  filterChipLabel: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  filterChipLabelActive: { color: 'white', fontWeight: '700' },
  list: { padding: 20, gap: 10, paddingBottom: 100 },
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  merchantAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  merchantInitial: { color: 'rgba(255,255,255,0.9)', fontSize: 20, fontWeight: '800' },
  cardBody: { flex: 1, gap: 2 },
  merchantName: { fontSize: 15, fontWeight: '700', color: '#111827', letterSpacing: -0.2 },
  merchantCat: { fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize' },
  ptsBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  ptsText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  stampDots: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  stampDot: { width: 14, height: 14, borderRadius: 7 },
  stampDotFilled: { backgroundColor: '#fbbf24' },
  stampDotEmpty: { backgroundColor: 'white', borderWidth: 2, borderColor: '#E5E7EB' },
  stampDotCount: { fontSize: 10, color: '#9CA3AF', marginLeft: 2 },
  stampBar: { marginTop: 8, gap: 4 },
  stampBarHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  stampBarLabel: { fontSize: 11, fontWeight: '600', color: '#374151' },
  stampBarToGo: { fontSize: 10, fontWeight: '700', color: '#f59e0b' },
  stampBarTrack: { height: 5, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  stampBarFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 999 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
});
