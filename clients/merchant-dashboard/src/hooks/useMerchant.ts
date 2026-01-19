import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMerchantSettings, updateMerchantSettings } from '../api/merchant';
import type { Merchant } from '../api/types';

export function useMerchantSettings() {
  return useQuery<Merchant>({
    queryKey: ['merchant', 'settings'],
    queryFn: getMerchantSettings,
  });
}

export function useUpdateMerchantSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateMerchantSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'settings'] });
    },
  });
}
