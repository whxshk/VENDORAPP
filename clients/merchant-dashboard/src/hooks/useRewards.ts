import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRewards, createReward, updateReward, deleteReward } from '../api/merchant';
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
  
  return useMutation({
    mutationFn: createReward,
    onSuccess: () => {
      invalidateRewardRelatedQueries(queryClient);
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  
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
    onError: (_err, _vars, context) => {
      if (context?.previousRewards) {
        queryClient.setQueryData(['rewards'], context.previousRewards);
      }
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
