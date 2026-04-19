import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../api/customerService';

const NAVY = '#0A1931';

// Replace with actual URLs before App Store / Play Store submission
const PRIVACY_URL = 'https://sharkband.cloud/privacy';
const TERMS_URL = 'https://sharkband.cloud/terms';
const SUPPORT_EMAIL = 'support@sharkband.cloud';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await customerService.getProfile();
      return res.data;
    },
    enabled: !!user,
  });

  const displayName = profile?.full_name ?? profile?.name ?? user?.full_name ?? user?.name ?? 'Customer';
  const displayEmail = profile?.email ?? user?.email ?? '';
  const displayPhone = profile?.phone ?? user?.phone ?? '';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          queryClient.clear(); // Wipe cached data before next user logs in
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your reward data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingAccount(true);
              await customerService.deleteAccount();
              queryClient.clear();
              await logout();
            } catch {
              setDeletingAccount(false);
              Alert.alert('Error', 'Failed to delete account. Please contact support@sharkband.cloud.');
            }
          },
        },
      ],
    );
  };

  const openUrl = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', `Unable to open ${url}`);
    }
  };

  const openSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=SharkBand Support`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.avatarName}>{displayName}</Text>
          <Text style={styles.avatarEmail}>{displayEmail}</Text>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <View style={styles.card}>
            <InfoRow label="Full Name" value={displayName} />
            <View style={styles.divider} />
            <InfoRow label="Email" value={displayEmail} />
            {displayPhone ? (
              <>
                <View style={styles.divider} />
                <InfoRow label="Phone" value={displayPhone} />
              </>
            ) : null}
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <MenuItem icon="🔒" label="Privacy Policy" onPress={() => openUrl(PRIVACY_URL)} />
            <View style={styles.divider} />
            <MenuItem icon="📄" label="Terms of Service" onPress={() => openUrl(TERMS_URL)} />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help</Text>
          <View style={styles.card}>
            <MenuItem icon="💬" label="Contact Support" onPress={openSupport} />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <MenuItem icon="🚪" label="Sign Out" onPress={handleLogout} danger />
            <View style={styles.divider} />
            <MenuItem icon="🗑️" label="Delete Account" onPress={handleDeleteAccount} danger />
          </View>
        </View>

        <Text style={styles.appVersion}>SharkBand v1.0.0</Text>
      </ScrollView>

      {deletingAccount && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.overlayText}>Deleting account...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingBottom: 100 },
  header: { backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 24, fontWeight: '800', color: NAVY },
  avatarSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', marginBottom: 8 },
  avatarBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: '#fff' },
  avatarName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  avatarEmail: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  section: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: '#111827' },
  menuLabelDanger: { color: '#EF4444' },
  menuChevron: { fontSize: 20, color: '#D1D5DB' },
  appVersion: { textAlign: 'center', color: '#D1D5DB', fontSize: 12, marginTop: 24 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: 16 },
  overlayText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
