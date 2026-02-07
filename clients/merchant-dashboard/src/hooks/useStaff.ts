import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStaff, inviteStaff, createStaff, updateStaff } from '../api/merchant';
import type { Staff } from '../api/types';

// Helper to invalidate all staff-related queries
function invalidateStaffRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['staff'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Transactions might show staff names
  queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Dashboard might show staff stats
}

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
      invalidateStaffRelatedQueries(queryClient);
    },
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      invalidateStaffRelatedQueries(queryClient);
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaff,
    onSuccess: () => {
      invalidateStaffRelatedQueries(queryClient);
    },
  });
}
