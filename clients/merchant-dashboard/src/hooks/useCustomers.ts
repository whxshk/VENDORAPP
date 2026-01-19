import { useQuery } from '@tanstack/react-query';
import { listCustomers, getCustomer } from '../api/merchant';
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
