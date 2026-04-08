import apiClient from './apiClient';

export const authService = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password, tenantId: 'sharkband-platform' }),
  requestLoginOtp: (email, password) =>
    apiClient.post('/auth/request-login-otp', { email, password, tenantId: 'sharkband-platform' }),
  register: (email, password, name) =>
    apiClient.post('/auth/register', { email, password, name }),
  requestRegisterOtp: (email, password, name) =>
    apiClient.post('/auth/request-register-otp', { email, password, name }),
  verifyOtp: (email, code, purpose, tenantId) =>
    apiClient.post('/auth/verify-otp', { email, code, purpose, tenantId }),
  me: () => apiClient.get('/auth/me'),
  refresh: (refreshToken) =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
};
