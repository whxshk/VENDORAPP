import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../api/authService';
import { customerService } from '../api/customerService';

export interface User {
  userId: string;
  email: string;
  name?: string;
  full_name?: string;
  customerId?: string;
  phone?: string;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  verifyOtp: (email: string, code: string, purpose: 'login' | 'signup', tenantId?: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  // Guard against concurrent checkAuth calls
  const checkingRef = useRef(false);

  useEffect(() => {
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const [meResult, profileResult, onboardedResult] = await Promise.allSettled([
        authService.me(),
        customerService.getProfile(),
        SecureStore.getItemAsync('hasCompletedOnboarding'),
      ]);

      if (meResult.status !== 'fulfilled') {
        // auth/me failed — tokens are invalid, clear them
        await _clearTokens();
        setUser(null);
        setLoading(false);
        return;
      }

      const authUser = meResult.value.data;
      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
      const onboarded = onboardedResult.status === 'fulfilled' ? onboardedResult.value : null;

      setUser({
        userId: authUser.userId || authUser.id,
        email: authUser.email,
        name: authUser.name,
        full_name: profile?.full_name || authUser.full_name || authUser.name,
        customerId: profile?.customerId || profile?.id || authUser.customerId,
        phone: profile?.phone,
        roles: authUser.roles,
      });
      setHasCompletedOnboarding(onboarded === 'true');
    } catch {
      await _clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
      checkingRef.current = false;
    }
  };

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    const { access_token, refresh_token } = res.data;
    await SecureStore.setItemAsync('access_token', access_token);
    if (refresh_token) await SecureStore.setItemAsync('refresh_token', refresh_token);
    await checkAuth();
  };

  const register = async (email: string, password: string, name: string) => {
    await authService.requestRegisterOtp(email, password, name);
  };

  const verifyOtp = async (
    email: string,
    code: string,
    purpose: 'login' | 'signup',
    tenantId?: string,
  ) => {
    const res = await authService.verifyOtp(email, code, purpose, tenantId);
    const { access_token, refresh_token } = res.data;
    await SecureStore.setItemAsync('access_token', access_token);
    if (refresh_token) await SecureStore.setItemAsync('refresh_token', refresh_token);
    await checkAuth();
  };

  const completeOnboarding = async () => {
    await SecureStore.setItemAsync('hasCompletedOnboarding', 'true');
    setHasCompletedOnboarding(true);
  };

  const logout = async () => {
    await _clearTokens();
    setUser(null);
    setHasCompletedOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasCompletedOnboarding,
        login,
        register,
        verifyOtp,
        completeOnboarding,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

async function _clearTokens() {
  try {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('hasCompletedOnboarding');
  } catch {
    // SecureStore errors during cleanup are non-fatal
  }
}
