import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listTransactions, voidTransaction } from '../api/merchant';
import type { ListTransactionsParams } from '../api/types';

export function useTransactions(params?: ListTransactionsParams) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => listTransactions(params),
  });
}

export function useVoidTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voidTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
