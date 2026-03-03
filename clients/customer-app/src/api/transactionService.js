import apiClient from './apiClient';

export const transactionService = {
  // Get customer transaction history from ledger (page-based)
  list: (customerId, params = {}) =>
    apiClient.get('/ledger/history', { params: { customerId, ...params } }),

  // Stub for merchant-filtered history — Phase 6 will add merchantId backend support
  listByMerchant: (customerId, merchantId, params = {}) =>
    apiClient.get('/ledger/history', { params: { customerId, merchantId, ...params } }),
};
