import apiClient from './apiClient';

export const ledgerService = {
  getBalance: (customerId) =>
    apiClient.get('/ledger/balance', { params: { customerId } }),
  getHistory: (customerId, params) =>
    apiClient.get('/ledger/history', { params: { customerId, ...params } }),
};
