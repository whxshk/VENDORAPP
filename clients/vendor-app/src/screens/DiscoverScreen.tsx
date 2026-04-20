import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { merchantService } from '../api/merchantService';
import { SearchIcon, LocationIcon } from '../components/Icons';

const NAVY = '#0A1931';
const ORANGE = '#F97316';

const CATEGORIES = [
  { key: 'all',           label: 'All' },
  { key: 'café',          label: 'Café' },
  { key: 'restaurant',    label: 'Restaurant' },
  { key: 'grocery',       label: 'Grocery' },
  { key: 'fitness',       label: 'Fitness' },
  { key: 'retail',        label: 'Retail' },
];

const MERCHANT_COLORS = [
  '#1e3a5f', '#3b1f0d', '#0d2b1a', '#1a0d2b',
  '#2b0d1a', '#1a2b0d', '#0d1a2b', '#2b1a0d',
];
function merchantColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return MERCHANT_COLORS[Math.abs(hash) % MERCHANT_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

interface Merchant {
  id?: string | number;
  name?: string;
  category?: string;
  description?: string;
  address?: string;
  rewards_count?: number;
}

function MerchantGridCard({ merchant }: { merchant: Merchant }) {
  const name = merchant.name ?? 'Merchant';
  const color = merchantColor(name);
  const rewardCount = merchant.rewards_count ?? 1;

  return (
    <TouchableOpacity style={styles.gridCard} activeOpacity={0.75}>
      {/* Colored banner with initials */}
      <View style={[styles.gridBanner, { backgroundColor: color }]}>
        <Text style={styles.gridInitials}>{initials(name).toUpperCase()}</Text>
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={1}>{name}</Text>
        {merchant.category && (
          <Text style={styles.gridCat}>{merchant.category}</Text>
        )}
        <Text style={styles.gridRewards}>
          {rewardCount} reward{rewardCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [nearMe, setNearMe] = useState(false);

  const { data: merchants = [], isLoading } = useQuery<Merchant[]>({
    queryKey: ['merchants'],
    queryFn: async () => {
      const res = await merchantService.list({ is_active: true });
      return Array.isArray(res.data) ? res.data : (res.data?.merchants ?? []);
    },
  });

  const filtered = merchants.filter((m) => {
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || m.category?.toLowerCase() === category;
    return matchSearch && matchCategory;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find SharkBand merchants near you</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <SearchIcon color="#9CA3AF" size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or keyword..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filters row: Near Me + categories */}
      <View style={styles.filtersOuter}>
        {/* Near Me button */}
        <TouchableOpacity
          style={[styles.nearMeBtn, nearMe && styles.nearMeBtnActive]}
          onPress={() => setNearMe(!nearMe)}
          accessibilityRole="button"
          accessibilityState={{ selected: nearMe }}
        >
          <LocationIcon color={nearMe ? 'white' : '#6B7280'} size={12} />
          <Text style={[styles.nearMeLabel, nearMe && styles.nearMeLabelActive]}>Near Me</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={[styles.filterChip, category === c.key && styles.filterChipActive]}
              onPress={() => setCategory(c.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: category === c.key }}
            >
              <Text style={[styles.filterChipLabel, category === c.key && styles.filterChipLabelActive]}>
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
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {filtered.length} merchant{filtered.length !== 1 ? 's' : ''} found
            </Text>
          }
          renderItem={({ item }) => <MerchantGridCard merchant={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No merchants found</Text>
              <Text style={styles.emptyDesc}>Try a different search or category</Text>
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
    paddingBottom: 14,
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
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', height: 44 },
  filtersOuter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nearMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexShrink: 0,
  },
  nearMeBtnActive: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 3,
  },
  nearMeLabel: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  nearMeLabelActive: { color: 'white', fontWeight: '700' },
  categoryRow: { gap: 7, alignItems: 'center' },
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
  resultCount: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginBottom: 12 },
  grid: { padding: 20, paddingBottom: 100 },
  gridRow: { gap: 12, marginBottom: 12 },
  gridCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  gridBanner: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridInitials: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  gridInfo: { padding: 12 },
  gridName: { fontSize: 13, fontWeight: '700', color: '#111827', letterSpacing: -0.2 },
  gridCat: { fontSize: 10, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },
  gridRewards: { fontSize: 10, fontWeight: '700', color: ORANGE, marginTop: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
