import apiClient from './client';

export interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  roles: string[];
  scopes: string[];
  tenantId: string;
}

export const ADMIN_ROLES = ['PLATFORM_ADMIN', 'SUPER_ADMIN'];

export function isAdminUser(user: AuthUser): boolean {
  return (
    user.roles?.some((r) => ADMIN_ROLES.includes(r)) ||
    user.scopes?.some((s) => s.startsWith('admin:') || s === 'platform:*')
  );
}

const PLATFORM_TENANT_ID = 'sharkband-platform';

export async function requestLoginOtp(email: string, password: string) {
  const res = await apiClient.post('/auth/request-login-otp', {
    email,
    password,
    tenantId: PLATFORM_TENANT_ID,
  });
  return res.data;
}

export async function verifyOtp(email: string, code: string): Promise<{ access_token: string }> {
  const res = await apiClient.post('/auth/verify-otp', {
    email,
    code,
    purpose: 'login',
    tenantId: PLATFORM_TENANT_ID,
  });
  return res.data;
}

export async function getMe(): Promise<AuthUser> {
  const res = await apiClient.get('/auth/me');
  return res.data;
}
