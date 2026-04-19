import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../api/customerService';

const NAVY = '#0A1931';
const ORANGE = '#F97316';

function WalletCard({ account }: { account: any }) {
  const isStamps = account.loyalty_type === 'stamps' || (account.stamps_balance !== undefined);
  const balance = isStamps ? account.stamps_balance ?? 0 : account.points_balance ?? 0;
  const unit = isStamps ? 'stamps' : 'pts';

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.logoBox}>
          {account.merchant_logo ? (
            <Text style={{ fontSize: 24 }}>🏪</Text>
          ) : (
            <Text style={styles.logoInitial}>{(account.merchant_name || '?')[0].toUpperCase()}</Text>
          )}
        </View>
        <View>
          <Text style={styles.merchantName}>{account.merchant_name || 'Merchant'}</Text>
          <Text style={styles.merchantCategory}>{account.merchant_category || 'Loyalty Card'}</Text>
        </View>
      </View>
      <View style={styles.balanceBadge}>
        <Text style={styles.balanceNum}>{balance}</Text>
        <Text style={styles.balanceUnit}>{unit}</Text>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['memberships', user?.userId],
    queryFn: async () => {
      const res = await customerService.getMemberships();
      return Array.isArray(res.data) ? res.data : (res.data?.memberships || []);
    },
    enabled: !!user,
  });

  const filtered = memberships.filter((m: any) =>
    !search || m.merchant_name?.toLowerCase().includes(search.toLowerCase()),
  );

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
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: '#9CA3AF', fontSize: 16, paddingRight: 12 }}>✕</Text>
          </TouchableOpacity>
        )}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
          renderItem={({ item }) => <WalletCard account={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No loyalty cards yet</Text>
              <Text style={styles.emptyDesc}>Visit a SharkBand merchant and scan your QR code to start collecting points!</Text>
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
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingLeft: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#111827' },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  logoBox: { width: 52, height: 52, backgroundColor: '#F3F4F6', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { fontSize: 22, fontWeight: '700', color: NAVY },
  merchantName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  merchantCategory: { fontSize: 12, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },
  balanceBadge: { backgroundColor: '#FFF7ED', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  balanceNum: { fontSize: 20, fontWeight: '800', color: ORANGE },
  balanceUnit: { fontSize: 11, color: ORANGE, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32, lineHeight: 18 },
});
