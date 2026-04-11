export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  apiProxyTarget:
    import.meta.env.VITE_API_PROXY_TARGET || 'https://sharkband-api.azurewebsites.net',
} as const;
