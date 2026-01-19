import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRewards, createReward, updateReward, deleteReward } from '../api/merchant';
import type { Reward, CreateRewardParams } from '../api/types';

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
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...params }: { id: string } & Partial<CreateRewardParams>) =>
      updateReward(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}
