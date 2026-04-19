import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://api.sharkband.cloud/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: API_BASE_URL });

    // Attach JWT from SecureStore on every request
    this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      const token = await SecureStore.getItemAsync('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.headers && config.data != null) {
        config.headers['Content-Type'] = 'application/json';
      }
      return config;
    });

    // Auto-refresh on 401
    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const isAuthRoute =
          original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');
        const refreshToken = await SecureStore.getItemAsync('refresh_token');

        if (error.response?.status === 401 && !original._retry && !isAuthRoute && refreshToken) {
          original._retry = true;
          try {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });
            const { access_token, refresh_token } = res.data;
            await SecureStore.setItemAsync('access_token', access_token);
            await SecureStore.setItemAsync('refresh_token', refresh_token);
            original.headers!.Authorization = `Bearer ${access_token}`;
            return this.client(original);
          } catch {
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  get instance() {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;
