import apiClient from './apiClient';

export const customerService = {
  getQrToken: () => apiClient.get('/customers/me/qr-token'),
  getMemberships: () => apiClient.get('/customers/me/memberships'),
  getProfile: () => apiClient.get('/customers/me'),
  // Phase 6: backend needs DELETE /customers/me to fully implement this
  deleteAccount: () => apiClient.delete('/customers/me'),
};
