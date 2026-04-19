import { apiClient } from './apiClient';

export const ledgerService = {
  getBalance: (customerId: string) =>
    apiClient.get('/ledger/balance', { params: { customerId } }),

  getHistory: (customerId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get('/ledger/history', { params: { customerId, ...params } }),
};
