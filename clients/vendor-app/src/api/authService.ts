import { apiClient } from './apiClient';

const TENANT_ID = 'sharkband-platform';

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password, tenantId: TENANT_ID }),

  requestRegisterOtp: (email: string, password: string, name: string) =>
    apiClient.post('/auth/request-register-otp', { email, password, name }),

  verifyOtp: (email: string, code: string, purpose: 'login' | 'signup', tenantId?: string) =>
    apiClient.post('/auth/verify-otp', { email, code, purpose, tenantId }),

  me: () => apiClient.get('/auth/me'),

  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
};
