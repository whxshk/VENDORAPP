import { apiClient } from './apiClient';

export const merchantService = {
  list: (params?: Record<string, any>) => apiClient.get('/merchants', { params }),
  getById: (id: string) => apiClient.get(`/merchants/${id}`),
  nearby: (lat: number, lng: number, radius = 25000) =>
    apiClient.get('/merchants/nearby', { params: { lat, lng, radius } }),
};
