import { useEffect, useState } from 'react';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

/**
 * On app load: if we have a token but no user (e.g. after refresh),
 * fetch /auth/me and set user. Logout on 401.
 * Always requires explicit login - no auto-login.
 */
export function useAuthInit() {
  const [loading, setLoading] = useState(true);
  const { accessToken, user, setUser, logout } = useAuthStore();

  useEffect(() => {
    // Always require explicit login - no auto-login
    if (!accessToken) {
      setLoading(false);
      return;
    }
    if (user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    authApi
      .me()
      .then((res) => {
        if (!cancelled) {
          setUser(res.data);
        }
      })
      .catch((err: any) => {
        if (!cancelled && err?.response?.status === 401) {
          logout();
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, user, setUser, logout]);

  return { loading };
}
