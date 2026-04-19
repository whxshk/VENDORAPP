import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'https://api.sharkband.cloud/api/v1';

const REQUEST_TIMEOUT_MS = 30_000;

// Single in-flight refresh promise to prevent parallel refresh races
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await SecureStore.getItemAsync('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const res = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  const { access_token, refresh_token: newRefresh } = res.data;
  await SecureStore.setItemAsync('access_token', access_token);
  if (newRefresh) await SecureStore.setItemAsync('refresh_token', newRefresh);
  return access_token;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT_MS,
    });

    // Attach JWT from SecureStore on every request
    this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // SecureStore unavailable — proceed without token
      }
      return config;
    });

    // Auto-refresh on 401, deduplicating concurrent refresh calls
    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const isAuthRoute =
          original?.url?.includes('/auth/login') ||
          original?.url?.includes('/auth/refresh') ||
          original?.url?.includes('/auth/register');

        if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
          original._retry = true;
          try {
            // Reuse any in-flight refresh instead of sending parallel requests
            if (!refreshPromise) {
              refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null;
              });
            }
            const newToken = await refreshPromise;
            original.headers!.Authorization = `Bearer ${newToken}`;
            return this.client(original);
          } catch {
            // Refresh failed — clear all credentials and force re-login
            try {
              await SecureStore.deleteItemAsync('access_token');
              await SecureStore.deleteItemAsync('refresh_token');
            } catch {
              // ignore SecureStore errors during cleanup
            }
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
