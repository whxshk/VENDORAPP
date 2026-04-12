import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/client';
import { merchantSignup } from '../api/merchant';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/input';
import { PlacesAutocompleteInput } from '../components/ui/PlacesAutocompleteInput';
import { Button } from '../components/ui/button';
import { getAdminDashboardUrl, getAdminOtpEmail, isDemoMode } from '../config/env';
import { cn } from '../lib/utils';
import { isScanOnlyUser } from '../lib/permissions';

type Mode = 'login' | 'signup';
const ADMIN_ROLES = new Set(['PLATFORM_ADMIN', 'SUPER_ADMIN']);
const MERCHANT_ROLES = new Set(['MERCHANT_ADMIN', 'MANAGER', 'CASHIER', 'STAFF', 'JANITOR']);
const ADMIN_TOKEN_KEY = 'admin_access_token';
const PLATFORM_TENANT_ID = 'sharkband-platform';
const ADMIN_OTP_EMAIL = getAdminOtpEmail().trim().toLowerCase();

function isPlatformAdmin(user: any): boolean {
  return (
    user?.roles?.some((role: string) => ADMIN_ROLES.has(role)) ||
    user?.scopes?.some((scope: string) => scope === 'platform:*' || scope.startsWith('admin:'))
  );
}

function isAdminOtpUser(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_OTP_EMAIL;
}

function isMerchantDashboardUser(user: any): boolean {
  return (
    user?.roles?.some((role: string) => MERCHANT_ROLES.has(role)) ||
    user?.scopes?.some((scope: string) => scope === 'merchant:*' || scope === 'scan:*' || scope.startsWith('merchant:') || scope.startsWith('scan:'))
  );
}

function redirectToAdminDashboard(accessToken: string, clearMerchantSession: () => void) {
  const adminDashboardUrl = getAdminDashboardUrl();
  if (!adminDashboardUrl) {
    throw new Error('Admin dashboard URL is not configured. Set VITE_ADMIN_DASHBOARD_URL before using admin login.');
  }

  clearMerchantSession();
  localStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
  window.location.assign(adminDashboardUrl);
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [mounted, setMounted] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens, setUser, logout } = useAuthStore();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminOtpCode, setAdminOtpCode] = useState('');
  const [adminOtpStep, setAdminOtpStep] = useState(false);
  const [adminOtpMessage, setAdminOtpMessage] = useState('');

  // Signup state
  const [signupBusinessName, setSignupBusinessName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupLocationName, setSignupLocationName] = useState('');
  const [signupLocationAddress, setSignupLocationAddress] = useState('');
  const [signupPasscode, setSignupPasscode] = useState('');
  const [signupLogoDataUrl, setSignupLogoDataUrl] = useState<string | null>(null);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchMode = (next: Mode) => {
    setLoginError('');
    setSignupError('');
    setAdminOtpCode('');
    setAdminOtpStep(false);
    setAdminOtpMessage('');
    setMode(next);
  };

  const resetAdminOtpFlow = () => {
    setAdminOtpCode('');
    setAdminOtpStep(false);
    setAdminOtpMessage('');
  };

  const requestOtpCode = async () => {
    const otpResponse = await authApi.requestLoginOtp(
      email,
      password,
      isAdminOtpUser(email) ? PLATFORM_TENANT_ID : undefined,
    );

    resetAdminOtpFlow();
    setAdminOtpStep(true);
    setAdminOtpMessage(
      otpResponse.data?.message || `We sent a 6-digit verification code to ${email}.`,
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const demoMode = isDemoMode();

    try {
      if (demoMode) {
        const mockToken = 'demo-token-' + Date.now();
        setTokens(mockToken, 'demo-refresh-token');
        setUser({ email: email || 'admin@demo.com', id: 'demo-user' });
        navigate('/dashboard');
      } else if (isAdminOtpUser(email)) {
        await requestOtpCode();
        return;
      } else {
        const response = await authApi.login(email, password);
        const { access_token, refresh_token } = response.data;

        setTokens(access_token, refresh_token);

        const userResponse = await authApi.me();
        const userData = userResponse.data;

        if (!isMerchantDashboardUser(userData)) {
          logout();
          throw new Error('This account is not allowed to access the merchant dashboard.');
        }

        setUser(userData);

        const isMerchantAdmin = userData.roles?.includes('MERCHANT_ADMIN');
        if (isScanOnlyUser(userData)) {
          navigate('/dashboard/scan');
        } else if (isMerchantAdmin && userData.hasCompletedOnboarding === false) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (!err?.response) {
        setLoginError('Could not connect to the server. Please check your internet connection and ensure the backend is running.');
      } else if (status === 401) {
        setLoginError('Invalid email or password. Please try again.');
      } else if (status === 500) {
        setLoginError('Backend is not reachable from the dashboard. Start backend on port 3001 and try again.');
      } else {
        const msg = err?.response?.data?.error?.message
          ?? err?.response?.data?.message
          ?? err?.message
          ?? 'Login failed. Please try again.';
        setLoginError(msg);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await authApi.verifyOtp(
        email,
        adminOtpCode,
        'login',
        isAdminOtpUser(email) ? PLATFORM_TENANT_ID : undefined,
      );
      const { access_token, refresh_token } = response.data;

      const userResponse = await authApi.meWithToken(access_token);
      const userData = userResponse.data;

      if (isPlatformAdmin(userData)) {
        if (!isAdminOtpUser(userData.email || email)) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          throw new Error('Access denied. This OTP flow is restricted to the approved platform admin account.');
        }

        redirectToAdminDashboard(access_token, logout);
        return;
      }

      if (!isMerchantDashboardUser(userData)) {
        logout();
        throw new Error('This account is not allowed to access the merchant dashboard.');
      }

      setTokens(access_token, refresh_token);
      setUser(userData);
      resetAdminOtpFlow();

      const isMerchantAdmin = userData.roles?.includes('MERCHANT_ADMIN');
      if (isScanOnlyUser(userData)) {
        navigate('/dashboard/scan');
      } else if (isMerchantAdmin && userData.hasCompletedOnboarding === false) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      logout();
      const status = err?.response?.status;
      if (!err?.response) {
        setLoginError(err?.message || 'Could not verify the code. Please try again.');
      } else if (status === 400 || status === 401) {
        setLoginError(
          err?.response?.data?.error?.message
            ?? err?.response?.data?.message
            ?? 'The verification code is invalid or expired.',
        );
      } else {
        const msg = err?.response?.data?.error?.message
          ?? err?.response?.data?.message
          ?? err?.message
          ?? 'Could not verify the code. Please try again.';
        setLoginError(msg);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSignupLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!signupBusinessName.trim()) { setSignupError('Business name is required.'); return; }
    if (!signupEmail.trim()) { setSignupError('Email is required.'); return; }
    if (signupPassword.length < 8) { setSignupError('Password must be at least 8 characters.'); return; }
    if (signupPassword !== signupConfirmPassword) { setSignupError('Passwords do not match.'); return; }
    if (!signupLocationName.trim()) { setSignupError('Location name is required.'); return; }
    if (signupPasscode !== '2026') { setSignupError('Invalid secret passcode. Please contact SharkBand to get access.'); return; }

    setSignupLoading(true);
    try {
      await merchantSignup({
        merchantName: signupBusinessName.trim(),
        adminEmail: signupEmail.trim(),
        adminPassword: signupPassword,
        locationName: signupLocationName.trim(),
        locationAddress: signupLocationAddress.trim() || undefined,
        logoUrl: signupLogoDataUrl ?? undefined,
      });

      // Auto-login after successful signup
      const response = await authApi.login(signupEmail.trim(), signupPassword);
      const { access_token, refresh_token } = response.data;
      setTokens(access_token, refresh_token);

      const userResponse = await authApi.me();
      setUser(userResponse.data);

      navigate('/onboarding');
    } catch (err: any) {
      const status = err?.response?.status;
      if (!err?.response) {
        setSignupError('Could not connect to the server. Please ensure the backend is running.');
      } else if (status === 409) {
        setSignupError('An account with this email already exists. Please log in instead.');
      } else {
        const msg = err?.response?.data?.error?.message
          ?? err?.response?.data?.message
          ?? err?.message
          ?? 'Sign up failed. Please try again.';
        setSignupError(msg);
      }
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] p-8 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={cn(
            "absolute w-96 h-96 rounded-full",
            "bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl",
            "transition-all duration-1000 ease-out",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
          style={{ top: '10%', left: '10%', animation: 'float 8s ease-in-out infinite' }}
        />
        <div
          className={cn(
            "absolute w-80 h-80 rounded-full",
            "bg-gradient-to-br from-purple-500/20 to-transparent blur-3xl",
            "transition-all duration-1000 ease-out delay-300",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
          style={{ bottom: '10%', right: '10%', animation: 'float 10s ease-in-out infinite reverse' }}
        />
        <div
          className={cn(
            "absolute w-64 h-64 rounded-full",
            "bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl",
            "transition-all duration-1000 ease-out delay-500",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50"
          )}
          style={{ top: '50%', left: '60%', animation: 'float 12s ease-in-out infinite' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
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
            {mode === 'login' ? 'Merchant Login' : 'Create Merchant Account'}
          </h2>
        </div>

        {/* Card */}
        <div
          className={cn(
            "rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8",
            "transition-all duration-500 ease-out delay-200",
            "hover:border-white/10 hover:shadow-[0_0_60px_rgba(59,130,246,0.1)]",
            mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
          )}
        >
          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={adminOtpStep ? handleAdminOtpVerify : handleLogin} className="space-y-6">
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
                  disabled={loginLoading || adminOtpStep}
                />
              </div>

              {!adminOtpStep ? (
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
                    disabled={loginLoading}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-100 text-sm animate-fade-in-down">
                    {adminOtpMessage || `We sent a 6-digit verification code to ${email}.`}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2" htmlFor="admin-otp">
                      Verification Code
                    </label>
                    <Input
                      type="text"
                      id="admin-otp"
                      value={adminOtpCode}
                      onChange={(e) => setAdminOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      placeholder="Enter 6-digit code"
                      disabled={loginLoading}
                    />
                  </div>
                </div>
              )}

              {loginError && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in-down">
                  {loginError}
                </div>
              )}
              {searchParams.get('inviteAccepted') === '1' && !loginError && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm animate-fade-in-down">
                  Invite accepted successfully. Your account is now active.
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loginLoading}>
                {loginLoading ? (adminOtpStep ? 'Verifying code...' : 'Logging in...') : (adminOtpStep ? 'Verify Code' : 'Login')}
              </Button>

              {adminOtpStep && (
                <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                  <button
                    type="button"
                    onClick={resetAdminOtpFlow}
                    className="text-slate-400 hover:text-slate-300 transition-colors"
                    disabled={loginLoading}
                  >
                    Back to password login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginError('');
                      setLoginLoading(true);
                      requestOtpCode()
                        .catch((err: any) => {
                          const msg = err?.response?.data?.error?.message
                            ?? err?.response?.data?.message
                            ?? err?.message
                            ?? 'Could not resend the code. Please try again.';
                          setLoginError(msg);
                        })
                        .finally(() => setLoginLoading(false));
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    disabled={loginLoading}
                  >
                    Resend code
                  </button>
                </div>
              )}

              <p className="text-center text-sm text-slate-400">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Forgot your password?
                </button>
              </p>

              <p className="text-center text-sm text-slate-400 pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Business Name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={signupBusinessName}
                  onChange={(e) => setSignupBusinessName(e.target.value)}
                  placeholder="e.g. The Pearl Coffee House"
                  disabled={signupLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <Input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="admin@yourbusiness.com"
                  disabled={signupLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <Input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  disabled={signupLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <Input
                  type="password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  disabled={signupLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  First Location Name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={signupLocationName}
                  onChange={(e) => setSignupLocationName(e.target.value)}
                  placeholder="e.g. Main Branch"
                  disabled={signupLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Location Address
                </label>
                <PlacesAutocompleteInput
                  value={signupLocationAddress}
                  onChange={setSignupLocationAddress}
                  placeholder="e.g. The Pearl, Doha, Qatar (optional)"
                  disabled={signupLoading}
                />
                <p className="text-xs text-slate-500 mt-1">Start typing to search — we'll pin it on the map automatically.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Restaurant Logo
                </label>
                <div className="flex items-center gap-4">
                  <label
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed",
                      "border-white/20 bg-white/5 text-slate-400 text-sm cursor-pointer",
                      "hover:border-blue-400/50 hover:bg-blue-500/5 hover:text-slate-300 transition-all",
                      signupLoading && "pointer-events-none opacity-50"
                    )}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {signupLogoDataUrl ? 'Change logo' : 'Upload logo (PNG, JPG)'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoChange}
                      disabled={signupLoading}
                    />
                  </label>
                  {signupLogoDataUrl && (
                    <img
                      src={signupLogoDataUrl}
                      alt="Logo preview"
                      className="w-14 h-14 rounded-lg object-cover border border-white/10"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Secret Passcode <span className="text-red-400">*</span>
                </label>
                <Input
                  type="password"
                  value={signupPasscode}
                  onChange={(e) => setSignupPasscode(e.target.value)}
                  placeholder="Enter the secret passcode"
                  disabled={signupLoading}
                />
                <p className="text-xs text-slate-500 mt-1">Contact SharkBand to obtain the passcode.</p>
              </div>

              {signupError && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-fade-in-down">
                  {signupError}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={signupLoading}>
                {signupLoading ? 'Creating account...' : 'Create Account'}
              </Button>

              <p className="text-center text-sm text-slate-400 pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Log in
                </button>
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
