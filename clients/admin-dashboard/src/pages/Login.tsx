import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { login, getMe, isAdminUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { Button, Input } from '../components/ui';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accessDenied = searchParams.get('error') === 'access_denied';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { access_token } = await login(email, password);
      localStorage.setItem('admin_access_token', access_token);

      const me = await getMe();
      if (!isAdminUser(me)) {
        localStorage.removeItem('admin_access_token');
        setError('Access denied. This dashboard is restricted to platform administrators.');
        return;
      }

      setAuth(me, access_token);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.3) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg, rgba(217,70,239,0.2), rgba(192,38,211,0.2))', border: '1px solid rgba(217,70,239,0.3)' }}>
            🦈
          </div>
          <h1 className="text-2xl font-black text-slate-100">SharkBand Admin</h1>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-admin-400" />
            <p className="text-xs font-semibold text-admin-400 uppercase tracking-widest">Platform Control Center</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-6 shadow-2xl"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}>

          {accessDenied && (
            <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 font-medium">
              ⚠️ Access denied. Admin role required.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sharkband.io"
              autoFocus
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 px-3 pr-10 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500/40 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              {loading ? 'Verifying…' : 'Sign In to Admin'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-700 mt-5">
          Restricted access · Platform administrators only
        </p>
      </div>
    </div>
  );
}
