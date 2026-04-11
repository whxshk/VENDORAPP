import apiClient from './client';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadata: Record<string, unknown>;
}

export async function listLogs(): Promise<SystemLogEntry[]> {
  const res = await apiClient.get<SystemLogEntry[]>('/platform-admin/logs');
  return res.data;
}
