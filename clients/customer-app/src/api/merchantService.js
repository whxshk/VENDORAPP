import apiClient from './apiClient';

export const merchantService = {
  list: (params) => apiClient.get('/merchants', { params }),
  getById: (id) => apiClient.get(`/merchants/${id}`),
  /**
   * Returns merchants sorted by distance from the given coordinates.
   * Only merchants with geocoded addresses appear in this response.
   * @param {number} lat
   * @param {number} lng
   * @param {number} [radius=25000] - metres
   */
  nearby: (lat, lng, radius = 25000) =>
    apiClient.get('/merchants/nearby', { params: { lat, lng, radius } }),
};
