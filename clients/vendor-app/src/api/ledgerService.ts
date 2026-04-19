import { apiClient } from './apiClient';

export const ledgerService = {
  // customerId is optional — backend can infer from JWT
  getBalance: (customerId?: string) =>
    apiClient.get('/ledger/balance', { params: customerId ? { customerId } : undefined }),

  getHistory: (params?: { page?: number; limit?: number; type?: string }) =>
    apiClient.get('/ledger/history', { params }),
};
