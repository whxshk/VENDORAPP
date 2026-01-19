import { useQuery } from '@tanstack/react-query';
import { listTransactions } from '../api/merchant';
import type { ListTransactionsParams } from '../api/types';

export function useTransactions(params?: ListTransactionsParams) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => listTransactions(params),
  });
}
