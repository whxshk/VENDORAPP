import { create } from 'zustand';
import type { AuthUser } from '../api/auth';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('admin_access_token'),
  loading: true,
  setAuth: (user, token) => {
    localStorage.setItem('admin_access_token', token);
    set({ user, token, loading: false });
  },
  logout: () => {
    localStorage.removeItem('admin_access_token');
    set({ user: null, token: null, loading: false });
  },
  setLoading: (v) => set({ loading: v }),
}));
