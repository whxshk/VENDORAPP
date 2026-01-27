import { useState } from 'react';
import { useRewards, useCreateReward, useUpdateReward, useDeleteReward } from '../../hooks/useRewards';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Gift, Plus, Edit, Trash2, Sparkles } from 'lucide-react';
import type { Reward } from '../../api/types';

const rewardSchema = z.object({
  name: z.string().min(1, 'Reward name is required'),
  description: z.string().min(1, 'Description is required'),
  pointsCost: z.number().min(1, 'Points must be at least 1'),
});

type RewardFormData = z.infer<typeof rewardSchema>;

export default function RewardsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const { data: rewards, isLoading } = useRewards();
  const createReward = useCreateReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
  });

  const onSubmit = (data: RewardFormData) => {
    if (editingReward) {
      updateReward.mutate(
        { id: editingReward.id, ...data, type: 'fixed' },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            setEditingReward(null);
            reset();
          },
        }
      );
    } else {
      createReward.mutate({ ...data, type: 'fixed' }, {
        onSuccess: () => {
          setIsCreateOpen(false);
          reset();
        },
      });
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    reset({
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this reward?')) {
      deleteReward.mutate(id, {
        onSuccess: () => {
          // Success is handled by query invalidation in the hook
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.error?.message 
            || error?.response?.data?.message 
            || error?.message 
            || 'Failed to delete reward';
          alert(`Failed to delete reward: ${errorMessage}`);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rewards</h1>
          <p className="text-slate-400">Manage your rewards catalog</p>
        </div>
        <div className="text-center py-12 text-slate-400">Loading rewards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Gift className="h-8 w-8 text-purple-400" />
            Rewards
          </h1>
          <p className="text-slate-400">Create and manage rewards for your customers</p>
        </div>
        <Button 
          onClick={() => {
            setEditingReward(null);
            reset();
            setIsCreateOpen(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Reward
        </Button>
      </div>

      {rewards?.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-purple-500/20">
                <Gift className="h-16 w-16 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">No rewards yet</h3>
                <p className="text-slate-400 mb-6">Create your first reward to start rewarding loyal customers</p>
              </div>
              <Button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Reward
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards?.map((reward) => (
            <Card 
              key={reward.id} 
              className="group hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 text-white group-hover:text-purple-300 transition-colors">
                      {reward.name}
                    </CardTitle>
                    <Badge 
                      variant={reward.isActive ? 'success' : 'secondary'}
                      className="text-xs"
                    >
                      {reward.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed min-h-[48px]">
                  {reward.description}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="flex items-baseline gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-3xl font-bold text-purple-400">{reward.pointsCost}</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider">points</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(reward)}
                      className="hover:bg-blue-500/20 hover:border-blue-500/50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(reward.id)}
                      className="hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingReward ? 'Edit Reward' : 'Create New Reward'}
            </DialogTitle>
            <DialogClose onClose={() => {
              setIsCreateOpen(false);
              setEditingReward(null);
              reset();
            }} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Reward Name <span className="text-red-400">*</span>
              </label>
              <Input 
                {...register('name')} 
                placeholder="e.g., Free Coffee"
                className="bg-slate-800/50 border-slate-700 focus:border-purple-500"
              />
              {errors.name && (
                <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Description <span className="text-red-400">*</span>
              </label>
              <Input 
                {...register('description')} 
                placeholder="e.g., Redeem for one free coffee of any size"
                className="bg-slate-800/50 border-slate-700 focus:border-purple-500"
              />
              {errors.description && (
                <p className="text-sm text-red-400 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Points Required <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                {...register('pointsCost', { valueAsNumber: true })}
                placeholder="e.g., 100"
                className="bg-slate-800/50 border-slate-700 focus:border-purple-500"
                min="1"
              />
              {errors.pointsCost && (
                <p className="text-sm text-red-400 mt-1">{errors.pointsCost.message}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                How many points customers need to redeem this reward
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingReward(null);
                  reset();
                }}
                className="hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createReward.isPending || updateReward.isPending}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
              >
                {createReward.isPending || updateReward.isPending ? (
                  'Saving...'
                ) : editingReward ? (
                  'Update Reward'
                ) : (
                  'Create Reward'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
