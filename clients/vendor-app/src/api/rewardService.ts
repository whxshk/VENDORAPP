import { apiClient } from './apiClient';

export const rewardService = {
  list: (params?: Record<string, any>) => apiClient.get('/rewards', { params }),
  listByMerchant: (merchantId: string) => apiClient.get(`/merchants/${merchantId}/rewards`),
};
