import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMe, isAdminUser } from '../api/auth';
import { Spinner } from '../components/ui';

export function AdminGuard() {
  const { user, token, loading, setAuth, logout, setLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      setLoading(false);
      if (!isAdminUser(user)) {
        logout();
        navigate('/login?error=access_denied', { replace: true });
      }
      return;
    }

    // Token exists but no user yet — fetch profile
    getMe()
      .then((me) => {
        if (!isAdminUser(me)) {
          logout();
          navigate('/login?error=access_denied', { replace: true });
        } else {
          setAuth(me, token);
        }
      })
      .catch(() => {
        logout();
        navigate('/login', { replace: true });
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl">🦈</div>
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminUser(user)) return null;

  return <Outlet />;
}
