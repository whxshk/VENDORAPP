import apiClient from './apiClient';

export const rewardService = {
  list: (params) => apiClient.get('/rewards', { params }),
  getById: (id) => apiClient.get(`/rewards/${id}`),
  listByMerchant: (merchantId) => apiClient.get(`/merchants/${merchantId}/rewards`),
};
