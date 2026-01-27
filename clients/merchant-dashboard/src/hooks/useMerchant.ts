import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMerchantSettings, updateMerchantSettings, createLocation } from '../api/merchant';
import type { Merchant, CreateLocationParams } from '../api/types';

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

export function useCreateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant', 'settings'] });
    },
  });
}
