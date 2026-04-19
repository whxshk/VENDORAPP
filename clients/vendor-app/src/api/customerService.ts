import { apiClient } from './apiClient';

export const customerService = {
  getQrToken: () => apiClient.get('/customers/me/qr-token'),
  getMemberships: () => apiClient.get('/customers/me/memberships'),
  getProfile: () => apiClient.get('/customers/me'),
  deleteAccount: () => apiClient.delete('/customers/me'),
};
