import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { merchantService } from '../api/merchantService';

const NAVY = '#0A1931';
const ORANGE = '#F97316';

const CATEGORIES = [
  { key: 'all', label: 'All', emoji: '🔥' },
  { key: 'cafe', label: 'Café', emoji: '☕' },
  { key: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { key: 'retail', label: 'Retail', emoji: '🛍️' },
  { key: 'grocery', label: 'Grocery', emoji: '🛒' },
  { key: 'fitness', label: 'Fitness', emoji: '💪' },
  { key: 'beauty', label: 'Beauty', emoji: '💄' },
];

function MerchantCard({ merchant }: { merchant: any }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.logoBox}>
          <Text style={styles.logoInitial}>{(merchant.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{merchant.name}</Text>
          {merchant.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{merchant.category}</Text>
            </View>
          )}
        </View>
      </View>
      {merchant.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>{merchant.description}</Text>
      )}
      {merchant.address && (
        <Text style={styles.cardAddress} numberOfLines={1}>📍 {merchant.address}</Text>
      )}
    </View>
  );
}

export default function DiscoverScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: merchants = [], isLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      const res = await merchantService.list({ is_active: true });
      return Array.isArray(res.data) ? res.data : (res.data?.merchants || []);
    },
  });

  const filtered = merchants.filter((m: any) => {
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || m.category?.toLowerCase() === category;
    return matchSearch && matchCategory;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find SharkBand merchants near you</Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search merchants..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.key}
        contentContainerStyle={styles.categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryBtn, category === item.key && styles.categoryBtnActive]}
            onPress={() => setCategory(item.key)}
          >
            <Text style={styles.categoryBtnEmoji}>{item.emoji}</Text>
            <Text style={[styles.categoryBtnLabel, category === item.key && styles.categoryBtnLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ORANGE} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <MerchantCard merchant={item} />}
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
  header: { backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 24, fontWeight: '800', color: NAVY },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingLeft: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#111827' },
  categories: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  categoryBtnActive: { backgroundColor: NAVY, borderColor: NAVY },
  categoryBtnEmoji: { fontSize: 14 },
  categoryBtnLabel: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  categoryBtnLabelActive: { color: '#fff' },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoBox: { width: 52, height: 52, backgroundColor: '#F3F4F6', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { fontSize: 22, fontWeight: '700', color: NAVY },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  categoryText: { fontSize: 11, color: '#6B7280', textTransform: 'capitalize' },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  cardAddress: { fontSize: 12, color: '#9CA3AF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyDesc: { fontSize: 13, color: '#9CA3AF' },
});
