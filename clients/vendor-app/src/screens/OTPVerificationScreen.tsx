import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTPVerification'>;
type Nav = NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;

const NAVY = '#0A1931';
const ORANGE = '#F97316';

export default function OTPVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props['route']>();
  const { verifyOtp, completeOnboarding } = useAuth();
  const { email, purpose } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const val = text.replace(/\D/g, '');
    const newCode = [...code];

    if (val.length > 1) {
      // Handle paste
      const pasted = val.slice(0, 6).split('');
      const filled = [...newCode];
      pasted.forEach((c, i) => { if (i < 6) filled[i] = c; });
      setCode(filled);
      inputs.current[Math.min(pasted.length - 1, 5)]?.focus();
      return;
    }

    newCode[index] = val;
    setCode(newCode);
    if (val && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const fullCode = code.join('');

  const handleVerify = async () => {
    if (fullCode.length !== 6) return;
    setLoading(true);
    try {
      await verifyOtp(email, fullCode, purpose);
      await completeOnboarding();
    } catch (error: any) {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Verification failed. Please try again.';
      Alert.alert('Verification Failed', msg);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.icon}>🛡️</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}{email}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              The code expires in 10 minutes. If it doesn't arrive, go back and try again.
            </Text>
            <View style={styles.otpRow}>
              {code.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => { if (el) inputs.current[i] = el; }}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  value={digit}
                  onChangeText={(t) => handleChange(t, i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, fullCode.length !== 6 && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading || fullCode.length !== 6}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Code →</Text>}
          </TouchableOpacity>

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
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  form: { flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', gap: 20 },
  cardText: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  otpInput: { width: 48, height: 56, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12, fontSize: 24, fontWeight: '700', color: '#111827', backgroundColor: '#F9FAFB' },
  otpInputFilled: { borderColor: ORANGE, backgroundColor: '#FFF7ED' },
  btnPrimary: { height: 52, backgroundColor: ORANGE, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#6B7280', fontSize: 14 },
});
