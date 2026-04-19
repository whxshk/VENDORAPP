import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ledgerService } from '../api/ledgerService';

const NAVY = '#0A1931';
const ORANGE = '#F97316';

type FilterKey = 'all' | 'earn' | 'redeem';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'earn', label: 'Earned' },
  { key: 'redeem', label: 'Redeemed' },
];

interface Transaction {
  id?: string;
  transaction_type?: string;
  type?: string;
  points_change?: number;
  stamps_change?: number;
  amount?: number;
  merchant_name?: string;
  merchantName?: string;
  description?: string;
  loyalty_type?: string;
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
}

function txTimestamp(tx: Transaction): string {
  return tx.created_at ?? tx.createdAt ?? tx.timestamp ?? new Date().toISOString();
}

function txIsEarn(tx: Transaction): boolean {
  const t = tx.transaction_type ?? tx.type ?? '';
  return t === 'earn' || t === 'ADD_STAMP' || t === 'GIVE_POINTS';
}

function txAmount(tx: Transaction): number {
  return Math.abs(tx.points_change ?? tx.stamps_change ?? tx.amount ?? 0);
}

function txUnit(tx: Transaction): string {
  return tx.loyalty_type === 'stamps' || tx.stamps_change !== undefined ? 'stamps' : 'pts';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

interface DateGroup {
  date: string;
  items: Transaction[];
}

function groupByDate(txs: Transaction[]): DateGroup[] {
  const groups: Record<string, Transaction[]> = {};
  for (const tx of txs) {
    const key = formatDate(txTimestamp(tx));
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

function TxRow({ tx }: { tx: Transaction }) {
  const isEarn = txIsEarn(tx);
  const merchant = tx.merchant_name ?? tx.merchantName ?? 'Merchant';
  const desc = tx.description ?? (isEarn ? 'Points earned' : 'Reward redeemed');
  const time = formatTime(txTimestamp(tx));
  const amount = txAmount(tx);
  const unit = txUnit(tx);

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconBox, { backgroundColor: isEarn ? '#F0FDF4' : '#FFF7ED' }]}>
        <Text style={styles.txIconText}>{isEarn ? '⬆️' : '🎁'}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txMerchant} numberOfLines={1}>{merchant}</Text>
        <Text style={styles.txDesc} numberOfLines={1}>{desc}</Text>
        <Text style={styles.txTime}>{time}</Text>
      </View>
      <View style={styles.txAmountBox}>
        <Text style={[styles.txAmount, { color: isEarn ? '#22C55E' : ORANGE }]}>
          {isEarn ? '+' : '-'}{amount}
        </Text>
        <Text style={styles.txUnit}>{unit}</Text>
      </View>
    </View>
  );
}

interface PageResult {
  items: Transaction[];
  nextPage: number;
  hasMore: boolean;
}

export default function ActivityScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<PageResult>({
    queryKey: ['activity', filter],
    queryFn: async ({ pageParam }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1;
      const params: { page: number; limit: number; type?: string } = { page, limit: 20 };
      if (filter !== 'all') params.type = filter;

      const res = await ledgerService.getHistory(params);
      const raw = res.data;
      const items: Transaction[] = Array.isArray(raw)
        ? raw
        : raw?.transactions ?? raw?.items ?? [];

      return {
        items,
        nextPage: page + 1,
        hasMore: Array.isArray(raw) ? raw.length === 20 : (raw?.hasMore ?? false),
      };
    },
    getNextPageParam: (last) => (last.hasMore ? last.nextPage : undefined),
    initialPageParam: 1,
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];
  const grouped = groupByDate(allItems);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your reward history</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f.key }}
            accessibilityLabel={`Filter by ${f.label}`}
          >
            <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Couldn't load activity</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(g) => g.date}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={styles.groupDate}>{group.date}</Text>
              <View style={styles.groupCard}>
                {group.items.map((tx, i) => (
                  <View key={tx.id ?? i}>
                    {i > 0 && <View style={styles.divider} />}
                    <TxRow tx={tx} />
                  </View>
                ))}
              </View>
            </View>
          )}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={ORANGE} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No activity yet</Text>
              <Text style={styles.emptyDesc}>Your reward transactions will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 24, fontWeight: '800', color: NAVY },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  filterBtnActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterLabelActive: { color: '#fff' },
  list: { padding: 16, gap: 16, paddingBottom: 100 },
  group: { gap: 8 },
  groupDate: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, paddingLeft: 4 },
  groupCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  txIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1, gap: 2 },
  txMerchant: { fontSize: 14, fontWeight: '700', color: '#111827' },
  txDesc: { fontSize: 12, color: '#6B7280' },
  txTime: { fontSize: 11, color: '#9CA3AF' },
  txAmountBox: { alignItems: 'flex-end', gap: 2 },
  txAmount: { fontSize: 18, fontWeight: '800' },
  txUnit: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorIcon: { fontSize: 48 },
  errorTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  retryBtn: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: NAVY, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '700' },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
