import { isDemoMode } from '../config/env';

export function getApiClient() {
  return isDemoMode() ? 'mock' : 'real';
}

export function shouldUseMockData(): boolean {
  return isDemoMode();
}
