import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: any | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: any) => void;
  logout: () => void;
}

// For demo mode, set a default user
const getInitialUser = () => {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1';
  if (isDemoMode) {
    const token = localStorage.getItem('access_token');
    if (token) {
      return { email: 'admin@demo.com', id: 'demo-user' };
    }
    // In demo mode, auto-create a token and user if none exists
    const demoToken = 'demo-token-' + Date.now();
    localStorage.setItem('access_token', demoToken);
    localStorage.setItem('refresh_token', 'demo-refresh-token');
    return { email: 'admin@demo.com', id: 'demo-user' };
  }
  return null;
};

const getInitialToken = () => {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1';
  if (isDemoMode) {
    const token = localStorage.getItem('access_token');
    if (!token) {
      const demoToken = 'demo-token-' + Date.now();
      localStorage.setItem('access_token', demoToken);
      localStorage.setItem('refresh_token', 'demo-refresh-token');
      return demoToken;
    }
    return token;
  }
  return localStorage.getItem('access_token');
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getInitialToken(),
  refreshToken: localStorage.getItem('refresh_token') || (import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1' ? 'demo-refresh-token' : null),
  user: getInitialUser(),

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({ accessToken, refreshToken });
    // Auto-set user in demo mode
    if (import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1') {
      set({ user: { email: 'admin@demo.com', id: 'demo-user' } });
    }
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
