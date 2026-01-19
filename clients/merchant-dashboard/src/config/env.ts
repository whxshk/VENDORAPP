export const config = {
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  environment: import.meta.env.VITE_ENVIRONMENT || 'DEMO', // DEMO, PILOT, LIVE
} as const;

export function isDemoMode(): boolean {
  return config.demoMode;
}

export function getEnvironment(): 'DEMO' | 'PILOT' | 'LIVE' {
  return config.environment as 'DEMO' | 'PILOT' | 'LIVE';
}
