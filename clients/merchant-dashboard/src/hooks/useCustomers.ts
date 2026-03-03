import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCustomers, getCustomer, adjustCustomerBalance } from '../api/merchant';
import type { ListCustomersParams, CustomerDetail } from '../api/types';

export function useCustomers(params?: ListCustomersParams) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => listCustomers(params),
  });
}

export function useCustomer(id: string) {
  return useQuery<CustomerDetail>({
    queryKey: ['customers', id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
}

export function useAdjustBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta, reason }: { id: string; delta: number; reason: string }) =>
      adjustCustomerBalance(id, delta, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
