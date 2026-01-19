import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/merchant';
import type { DashboardSummary } from '../api/types';

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
  });
}
