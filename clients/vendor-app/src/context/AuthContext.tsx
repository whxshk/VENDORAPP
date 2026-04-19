import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../api/authService';
import { customerService } from '../api/customerService';

interface User {
  userId: string;
  email: string;
  name?: string;
  full_name?: string;
  customerId?: string;
  roles?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<any>;
  verifyOtp: (email: string, code: string, purpose: 'login' | 'signup', tenantId?: string) => Promise<void>;
  completeOnboarding: () => void;
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [meResult, profileResult] = await Promise.allSettled([
        authService.me(),
        customerService.getProfile(),
      ]);

      if (meResult.status !== 'fulfilled') throw meResult.reason;

      const authUser = meResult.value.data;
      const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;

      setUser({
        ...authUser,
        full_name: profile?.full_name || authUser.name || authUser.email,
        customerId: profile?.customerId || authUser.customerId || null,
      });

      const onboarded = await SecureStore.getItemAsync('hasCompletedOnboarding');
      setHasCompletedOnboarding(onboarded === 'true');
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
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
    const res = await authService.requestRegisterOtp(email, password, name);
    return res.data;
  };

  const verifyOtp = async (email: string, code: string, purpose: 'login' | 'signup', tenantId?: string) => {
    const res = await authService.verifyOtp(email, code, purpose, tenantId);
    const { access_token, refresh_token } = res.data;
    await SecureStore.setItemAsync('access_token', access_token);
    if (refresh_token) await SecureStore.setItemAsync('refresh_token', refresh_token);
    await checkAuth();
  };

  const completeOnboarding = () => {
    SecureStore.setItemAsync('hasCompletedOnboarding', 'true');
    setHasCompletedOnboarding(true);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('hasCompletedOnboarding');
    setUser(null);
    setHasCompletedOnboarding(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasCompletedOnboarding, login, register, verifyOtp, completeOnboarding, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
