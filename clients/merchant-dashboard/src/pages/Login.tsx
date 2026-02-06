import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { isDemoMode } from '../config/env';
import { cn } from '../lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating orbs */}
        <div 
          className={cn(
            "absolute w-96 h-96 rounded-full",
            "bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl",
            "transition-all duration-1000 ease-out",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
          style={{ 
            top: '10%', 
            left: '10%',
            animation: 'float 8s ease-in-out infinite',
          }} 
        />
        <div 
          className={cn(
            "absolute w-80 h-80 rounded-full",
            "bg-gradient-to-br from-purple-500/20 to-transparent blur-3xl",
            "transition-all duration-1000 ease-out delay-300",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
          style={{ 
            bottom: '10%', 
            right: '10%',
            animation: 'float 10s ease-in-out infinite reverse',
          }} 
        />
        <div 
          className={cn(
            "absolute w-64 h-64 rounded-full",
            "bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl",
            "transition-all duration-1000 ease-out delay-500",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
          style={{ 
            top: '50%', 
            left: '60%',
            animation: 'float 12s ease-in-out infinite',
          }} 
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and title with staggered animation */}
        <div className="text-center mb-8">
          <h1
            className={cn(
              "text-4xl font-bold mb-2 transition-all duration-700 ease-out",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
            )}
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
          <h2 
            className={cn(
              "text-2xl font-semibold text-white mt-2 transition-all duration-700 ease-out delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
            )}
          >
            Merchant Login
          </h2>
        </div>

        {/* Login card with scale animation */}
        <div 
          className={cn(
            "rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8",
            "transition-all duration-500 ease-out delay-200",
            "hover:border-white/10 hover:shadow-[0_0_60px_rgba(59,130,246,0.1)]",
            mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
          )}
        >
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
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in-down">
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
              <div 
                className={cn(
                  "p-3 rounded-lg bg-blue-500/10 border border-blue-500/20",
                  "transition-all duration-300 hover:bg-blue-500/20 hover:border-blue-500/40",
                  "hover:translate-x-1 cursor-pointer group"
                )}
                onClick={() => { setEmail('sarah@pilot-merchant.com'); setPassword('password123'); }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">MERCHANT_ADMIN</div>
                    <div className="text-xs text-slate-400 mt-1">Full access to all features</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono group-hover:text-blue-400 transition-colors">sarah@pilot-merchant.com</div>
                </div>
                <div className="text-xs text-slate-400">Password: password123</div>
                <div className="text-xs text-slate-500 mt-2">
                  • Dashboard • Customers • Transactions • Rewards • Staff Management • Settings
                </div>
              </div>

              {/* MANAGER */}
              <div 
                className={cn(
                  "p-3 rounded-lg bg-purple-500/10 border border-purple-500/20",
                  "transition-all duration-300 hover:bg-purple-500/20 hover:border-purple-500/40",
                  "hover:translate-x-1 cursor-pointer group"
                )}
                onClick={() => { setEmail('manager@pilot-merchant.com'); setPassword('password123'); }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">MANAGER</div>
                    <div className="text-xs text-slate-400 mt-1">View and manage operations</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono group-hover:text-purple-400 transition-colors">manager@pilot-merchant.com</div>
                </div>
                <div className="text-xs text-slate-400">Password: password123</div>
                <div className="text-xs text-slate-500 mt-2">
                  • Dashboard • Customers (view) • Transactions (view) • Rewards (view) • Staff (view) • Settings (view)
                </div>
              </div>

              {/* CASHIER */}
              <div 
                className={cn(
                  "p-3 rounded-lg bg-green-500/10 border border-green-500/20",
                  "transition-all duration-300 hover:bg-green-500/20 hover:border-green-500/40",
                  "hover:translate-x-1 cursor-pointer group"
                )}
                onClick={() => { setEmail('cashier@pilot-merchant.com'); setPassword('password123'); }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-green-400 group-hover:text-green-300 transition-colors">CASHIER</div>
                    <div className="text-xs text-slate-400 mt-1">Point-of-sale operations</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono group-hover:text-green-400 transition-colors">cashier@pilot-merchant.com</div>
                </div>
                <div className="text-xs text-slate-400">Password: password123</div>
                <div className="text-xs text-slate-500 mt-2">
                  • Scan Page • Customers (view) • Transactions (view)
                </div>
              </div>

              {/* STAFF */}
              <div 
                className={cn(
                  "p-3 rounded-lg bg-orange-500/10 border border-orange-500/20",
                  "transition-all duration-300 hover:bg-orange-500/20 hover:border-orange-500/40",
                  "hover:translate-x-1 cursor-pointer group"
                )}
                onClick={() => { setEmail('staff@pilot-merchant.com'); setPassword('password123'); }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-orange-400 group-hover:text-orange-300 transition-colors">STAFF</div>
                    <div className="text-xs text-slate-400 mt-1">Limited access</div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono group-hover:text-orange-400 transition-colors">staff@pilot-merchant.com</div>
                </div>
                <div className="text-xs text-slate-400">Password: password123</div>
                <div className="text-xs text-slate-500 mt-2">
                  • Scan Page (limited)
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">Click a role card to auto-fill credentials</p>
          </div>
        </div>
      </div>
    </div>
  );
}
