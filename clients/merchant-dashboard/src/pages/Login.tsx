import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { isDemoMode } from '../config/env';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const demoMode = isDemoMode();

    try {
      if (demoMode) {
        // In demo mode, accept any credentials
        const mockToken = 'demo-token-' + Date.now();
        setTokens(mockToken, 'demo-refresh-token');
        setUser({ email: email || 'admin@demo.com', id: 'demo-user' });
        navigate('/dashboard');
      } else {
        const response = await authApi.login(email, password);
        const { access_token, refresh_token } = response.data;

        setTokens(access_token, refresh_token);

        const userResponse = await authApi.me();
        setUser(userResponse.data);

        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message
        ?? err?.response?.data?.message
        ?? err?.message
        ?? 'Login failed. Check credentials and ensure the backend is running at http://localhost:3000.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] p-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-1/5 left-1/10 w-24 h-24 rounded-full bg-gradient-radial from-blue-500/30 to-transparent animate-pulse" />
        <div className="absolute bottom-1/5 right-1/10 w-32 h-32 rounded-full bg-gradient-radial from-purple-500/30 to-transparent animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            SharkBand
          </h1>
          <h2 className="text-2xl font-semibold text-white mt-2">Merchant Login</h2>
        </div>

        <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2" htmlFor="email">
                Email
              </label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2" htmlFor="password">
                Password
              </label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* Role-based credential examples */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white mb-4">Example Credentials by Role</h3>
            <div className="space-y-4">
              {/* MERCHANT_ADMIN */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-blue-400">MERCHANT_ADMIN</div>
                    <div className="text-xs text-slate-400 mt-1">Full access to all features</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">admin@example.com</div>
                </div>
                <div className="text-xs text-slate-400">Password: password123</div>
                <div className="text-xs text-slate-500 mt-2">
                  • Dashboard • Customers • Transactions • Rewards • Staff Management • Settings
                </div>
              </div>

              {/* MANAGER */}
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-purple-400">MANAGER</div>
                    <div className="text-xs text-slate-400 mt-1">View and manage operations</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">manager@example.com</div>
                </div>
                <div className="text-xs text-slate-400">Password: password123</div>
                <div className="text-xs text-slate-500 mt-2">
                  • Dashboard • Customers (view) • Transactions (view) • Rewards (view) • Staff (view) • Settings (view)
                </div>
              </div>

              {/* CASHIER */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-green-400">CASHIER</div>
                    <div className="text-xs text-slate-400 mt-1">Point-of-sale operations</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">cashier@example.com</div>
                </div>
                <div className="text-xs text-slate-400">Password: password123</div>
                <div className="text-xs text-slate-500 mt-2">
                  • Scan Page • Customers (view) • Transactions (view)
                </div>
              </div>

              {/* STAFF */}
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-orange-400">STAFF</div>
                    <div className="text-xs text-slate-400 mt-1">Limited access</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">staff@example.com</div>
                </div>
                <div className="text-xs text-slate-400">Password: password123</div>
                <div className="text-xs text-slate-500 mt-2">
                  • Scan Page (limited)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
