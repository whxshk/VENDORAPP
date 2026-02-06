import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// Error handler instance (will be set from outside)
let errorHandler: ((error: Error, context?: string) => void) | null = null;

export function setErrorHandler(handler: (error: Error, context?: string) => void) {
  errorHandler = handler;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: inject JWT token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        // Capture request errors
        if (errorHandler) {
          const apiError = new Error(`Request failed: ${error.message}`);
          (apiError as any).statusCode = 0;
          (apiError as any).context = `Request to ${error.config?.url || 'unknown'}`;
          errorHandler(apiError, 'API Request Error');
        }
        return Promise.reject(error);
      },
    );

    // Response interceptor: handle token refresh and errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 - token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const { access_token, refresh_token } = response.data;
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            originalRequest.headers!.Authorization = `Bearer ${access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (errorHandler) {
              const authError = new Error('Session expired. Please log in again.');
              (authError as any).statusCode = 401;
              (authError as any).context = 'Token refresh failed';
              errorHandler(authError, 'Authentication Error');
            }
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Capture and display API errors (but NOT 403 permission errors - those should show "Restricted" on page)
        const statusCode = error.response?.status || 0;
        if (errorHandler && statusCode !== 403) {
          const responseData = error.response?.data as any;
          const errorMessage = responseData?.error?.message 
            || responseData?.message 
            || error.message 
            || 'An API error occurred';
          
          const apiError = new Error(errorMessage);
          (apiError as any).statusCode = statusCode;
          (apiError as any).context = `API ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url || 'unknown'}`;
          
          errorHandler(apiError, 'API Error');
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

// Auth API
export const authApi = {
  login: (email: string, password: string, tenantId?: string) =>
    apiClient.post('/auth/login', { email, password, tenantId }),
  refresh: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }),
  me: () => apiClient.get('/auth/me'),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
};

// Fraud Signals API
export const fraudSignalsApi = {
  getSignals: (deviceId?: string, customerId?: string) =>
    apiClient.get('/fraud-signals', { params: { deviceId, customerId } }),
};

// Pilot Reports API
export const pilotReportsApi = {
  getWeeklyReport: (week?: string) =>
    apiClient.get('/analytics/pilot-weekly-report', { params: { week } }),
  getOnboardingFunnel: () =>
    apiClient.get('/analytics/pilot-onboarding-funnel'),
};
