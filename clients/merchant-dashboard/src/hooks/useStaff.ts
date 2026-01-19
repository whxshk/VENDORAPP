import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStaff, inviteStaff } from '../api/merchant';
import type { Staff } from '../api/types';

export function useStaff() {
  return useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: listStaff,
  });
}

export function useInviteStaff() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: inviteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}
