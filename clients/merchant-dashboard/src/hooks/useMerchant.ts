import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMerchantSettings, updateMerchantSettings, createLocation, updateLocation } from '../api/merchant';
import type { Merchant, UpdateLocationParams } from '../api/types';

// Helper to invalidate all location-related queries
function invalidateLocationRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  // Invalidate all queries that might display location/branch info
  queryClient.invalidateQueries({ queryKey: ['merchant'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['customers'] });
}

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
    // Optimistic update for instant UI feedback
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: ['merchant', 'settings'] });
      const previousSettings = queryClient.getQueryData<Merchant>(['merchant', 'settings']);
      
      if (previousSettings) {
        queryClient.setQueryData<Merchant>(['merchant', 'settings'], {
          ...previousSettings,
          ...newSettings,
        });
      }
      
      return { previousSettings };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(['merchant', 'settings'], context.previousSettings);
      }
    },
    onSettled: () => {
      invalidateLocationRelatedQueries(queryClient);
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      // Invalidate all related queries for instant updates everywhere
      invalidateLocationRelatedQueries(queryClient);
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateLocationParams }) => updateLocation(id, params),
    // Optimistic update - instantly update the UI before the server responds
    onMutate: async ({ id, params }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['merchant', 'settings'] });
      
      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<Merchant>(['merchant', 'settings']);
      
      // Optimistically update the cache
      if (previousSettings) {
        queryClient.setQueryData<Merchant>(['merchant', 'settings'], {
          ...previousSettings,
          branches: previousSettings.branches.map(branch =>
            branch.id === id ? { ...branch, ...params } : branch
          ),
        });
      }
      
      // Return the snapshot for rollback on error
      return { previousSettings };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['merchant', 'settings'], context.previousSettings);
      }
    },
    onSettled: () => {
      // Always invalidate to ensure we have fresh data from the server
      invalidateLocationRelatedQueries(queryClient);
    },
  });
}
