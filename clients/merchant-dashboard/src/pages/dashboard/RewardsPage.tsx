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
import { Gift, Plus, Edit, Trash2 } from 'lucide-react';
import type { Reward } from '../../api/types';

const rewardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  pointsCost: z.number().min(1, 'Points cost must be at least 1'),
  type: z.enum(['fixed', 'discount']),
  discountPercent: z.number().optional(),
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
    watch,
  } = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      type: 'fixed',
    },
  });

  const rewardType = watch('type');

  const onSubmit = (data: RewardFormData) => {
    if (editingReward) {
      updateReward.mutate(
        { id: editingReward.id, ...data },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            setEditingReward(null);
            reset();
          },
        }
      );
    } else {
      createReward.mutate(data, {
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
      type: reward.type,
      discountPercent: reward.discountPercent,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this reward?')) {
      deleteReward.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rewards</h1>
          <p className="text-slate-400">Manage your loyalty rewards catalog</p>
        </div>
        <div className="text-center py-12 text-slate-400">Loading rewards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rewards</h1>
          <p className="text-slate-400">Manage your loyalty rewards catalog</p>
        </div>
        <Button onClick={() => {
          setEditingReward(null);
          reset();
          setIsCreateOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Reward
        </Button>
      </div>

      {rewards?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-400 mb-6 text-lg">No rewards yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Reward
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards?.map((reward) => (
            <Card key={reward.id} className="hover:scale-[1.02] transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{reward.name}</CardTitle>
                  <Badge variant={reward.isActive ? 'success' : 'secondary'}>
                    {reward.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">{reward.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-purple-400">{reward.pointsCost}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">points</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(reward)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(reward.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReward ? 'Edit Reward' : 'Create Reward'}</DialogTitle>
            <DialogClose onClose={() => {
              setIsCreateOpen(false);
              setEditingReward(null);
              reset();
            }} />
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6">
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Name</label>
              <Input {...register('name')} />
              {errors.name && <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Description</label>
              <Input {...register('description')} />
              {errors.description && <p className="text-sm text-red-400 mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Points Cost</label>
              <Input
                type="number"
                {...register('pointsCost', { valueAsNumber: true })}
              />
              {errors.pointsCost && <p className="text-sm text-red-400 mt-1">{errors.pointsCost.message}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Type</label>
              <select
                {...register('type')}
                className="w-full h-11 rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              >
                <option value="fixed">Fixed Reward</option>
                <option value="discount">Discount</option>
              </select>
            </div>

            {rewardType === 'discount' && (
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Discount Percentage</label>
                <Input
                  type="number"
                  {...register('discountPercent', { valueAsNumber: true })}
                  placeholder="e.g., 10 for 10%"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingReward(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createReward.isPending || updateReward.isPending}>
                {editingReward ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
