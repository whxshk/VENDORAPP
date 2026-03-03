import apiClient from './apiClient';

export const merchantService = {
  list: (params) => apiClient.get('/merchants', { params }),
  getById: (id) => apiClient.get(`/merchants/${id}`),
};
