import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const NAVY = '#0A1931';
const ORANGE = '#F97316';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_REGEX.test(email.trim())) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      navigation.navigate('OTPVerification', { email: email.trim(), purpose: 'signup' });
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409) {
        Alert.alert('Account Exists', 'An account with this email already exists. Please sign in.');
      } else {
        const msg =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          'Registration failed. Please try again.';
        Alert.alert('Registration Failed', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, value: string, setter: (v: string) => void, errorKey: string, opts: any = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[errorKey] ? styles.inputError : null]}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={(v) => { setter(v); setErrors((p) => ({ ...p, [errorKey]: '' })); }}
        {...opts}
      />
      {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.icon}>👤</Text>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Join SharkBand and start earning loyalty rewards</Text>
          </View>

          <View style={styles.form}>
            {field('Full Name', name, setName, 'name', { placeholder: 'Jane Smith', autoCapitalize: 'words' })}
            {field('Email Address', email, setEmail, 'email', { placeholder: 'you@example.com', keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false })}
            {field('Password', password, setPassword, 'password', { placeholder: '••••••••', secureTextEntry: true })}
            {field('Confirm Password', confirmPassword, setConfirmPassword, 'confirmPassword', { placeholder: '••••••••', secureTextEntry: true })}

            <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Create Account →</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkBtn}>
              <Text style={styles.linkText}>← Already have an account? Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },
  scroll: { flexGrow: 1 },
  header: { backgroundColor: NAVY, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32, alignItems: 'center' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  form: { flex: 1, backgroundColor: '#F9FAFB', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { height: 52, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: '#111827' },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 2 },
  btnPrimary: { height: 52, backgroundColor: ORANGE, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { color: '#6B7280', fontSize: 14 },
});
