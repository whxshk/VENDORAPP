import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRewards, createReward, updateReward, deleteReward } from '../api/merchant';
import { useErrorHandlerContext } from './useErrorHandler';
import type { Reward, CreateRewardParams } from '../api/types';

// Helper to invalidate all reward-related queries
function invalidateRewardRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['rewards'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Dashboard might show reward stats
  queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Transactions might show reward names
}

export function useRewards() {
  return useQuery<Reward[]>({
    queryKey: ['rewards'],
    queryFn: listRewards,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  const { addError } = useErrorHandlerContext();

  return useMutation({
    mutationFn: createReward,
    onSuccess: () => {
      invalidateRewardRelatedQueries(queryClient);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message
        || error?.response?.data?.message
        || error?.message
        || 'Failed to create reward';
      addError(new Error(msg), 'Create Reward');
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  const { addError } = useErrorHandlerContext();

  return useMutation({
    mutationFn: ({ id, ...params }: { id: string } & Partial<CreateRewardParams>) =>
      updateReward(id, params),
    // Optimistic update for instant UI feedback
    onMutate: async ({ id, ...params }) => {
      await queryClient.cancelQueries({ queryKey: ['rewards'] });
      const previousRewards = queryClient.getQueryData<Reward[]>(['rewards']);
      
      if (previousRewards) {
        queryClient.setQueryData<Reward[]>(['rewards'], 
          previousRewards.map(reward =>
            reward.id === id ? { ...reward, ...params } : reward
          )
        );
      }
      
      return { previousRewards };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousRewards) {
        queryClient.setQueryData(['rewards'], context.previousRewards);
      }
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.message
        || err?.message
        || 'Failed to update reward';
      addError(new Error(msg), 'Update Reward');
    },
    onSettled: () => {
      invalidateRewardRelatedQueries(queryClient);
    },
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteReward,
    onSuccess: () => {
      invalidateRewardRelatedQueries(queryClient);
    },
  });
}
