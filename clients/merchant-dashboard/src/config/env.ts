const rawAdminDashboardUrl = import.meta.env.VITE_ADMIN_DASHBOARD_URL?.trim();
const isLocalDevelopmentHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const config = {
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  environment: import.meta.env.VITE_ENVIRONMENT || 'DEMO', // DEMO, PILOT, LIVE
  adminDashboardUrl: rawAdminDashboardUrl || (isLocalDevelopmentHost ? 'http://localhost:5175' : ''),
  adminOtpEmail: import.meta.env.VITE_ADMIN_OTP_EMAIL || 'tbmal7assan@gmail.com',
} as const;

export function isDemoMode(): boolean {
  return config.demoMode;
}

export function getEnvironment(): 'DEMO' | 'PILOT' | 'LIVE' {
  return config.environment as 'DEMO' | 'PILOT' | 'LIVE';
}

export function getAdminDashboardUrl(): string | null {
  const url = config.adminDashboardUrl.trim();
  return url ? url : null;
}

export function getAdminOtpEmail(): string {
  return config.adminOtpEmail;
}
