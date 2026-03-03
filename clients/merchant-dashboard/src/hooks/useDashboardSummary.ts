import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/merchant';
import type { DashboardSummary } from '../api/types';

export function useDashboardSummary(locationId?: string) {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary', locationId],
    queryFn: () => getDashboardSummary(locationId),
  });
}
