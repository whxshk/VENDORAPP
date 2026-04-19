import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../api/authService';
import type { AuthStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const NAVY = '#0A1931';
const ORANGE = '#F97316';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {sent ? "Check your email for a reset link." : "Enter your email and we'll send you a reset link."}
          </Text>
        </View>

        <View style={styles.form}>
          {!sent ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} disabled={loading || !email.trim()}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>✉️</Text>
              <Text style={styles.successTitle}>Email sent!</Text>
              <Text style={styles.successMsg}>Check your inbox for the password reset link. It may take a minute to arrive.</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkBtn}>
            <Text style={styles.linkText}>← Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  header: { backgroundColor: NAVY, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32, alignItems: 'center' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  form: { flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { height: 52, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#111827' },
  btnPrimary: { height: 52, backgroundColor: ORANGE, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#6B7280', fontSize: 14 },
  successCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  successIcon: { fontSize: 48 },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  successMsg: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
});
