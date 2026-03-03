import { useState, useEffect } from 'react';
import { useRewards, useCreateReward, useUpdateReward, useDeleteReward } from '../../hooks/useRewards';
import { useMerchantSettings, useUpdateMerchantSettings } from '../../hooks/useMerchant';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../components/ui/dialog';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { Badge } from '../../components/ui/badge';
import { Gift, Plus, Edit, Trash2, Sparkles, Stamp, Settings2, Save } from 'lucide-react';
import { toNumber, cn } from '../../lib/utils';
import { useErrorHandlerContext } from '../../hooks/useErrorHandler';
import type { Reward } from '../../api/types';

type RewardType = 'points' | 'stamps';

// valueAsNumber produces NaN for empty inputs — preprocess to undefined so zod accepts it
const numericOptional = z.preprocess(
  (val) => (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val))) ? undefined : Number(val),
  z.number().positive().optional()
);

const rewardSchema = z.object({
  name: z.string().min(1, 'Reward name is required'),
  description: z.string().min(1, 'Description is required'),
  pointsCost: numericOptional,
  stampsCost: numericOptional,
});

type RewardFormData = z.infer<typeof rewardSchema>;

export default function RewardsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);
  const [rewardType, setRewardType] = useState<RewardType>('points');
  const [formError, setFormError] = useState('');

  // Points-per-QAR setting
  const [pointsPerQarInput, setPointsPerQarInput] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const [rateSaved, setRateSaved] = useState(false);

  const { addError } = useErrorHandlerContext();
  const { data: rewards, isLoading } = useRewards();
  const { data: merchantSettings } = useMerchantSettings();
  const createReward = useCreateReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();
  const updateMerchantSettings = useUpdateMerchantSettings();

  useEffect(() => {
    if (merchantSettings?.pointsPerQar !== undefined) {
      setPointsPerQarInput(String(merchantSettings.pointsPerQar));
    }
  }, [merchantSettings?.pointsPerQar]);

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<RewardFormData>({
    resolver: zodResolver(rewardSchema),
  });

  const watchedPointsCost = useWatch({ control, name: 'pointsCost' });
  const watchedStampsCost = useWatch({ control, name: 'stampsCost' });

  const effectiveRate = Number(pointsPerQarInput) || Number(merchantSettings?.pointsPerQar) || 1;

  const handleSaveRate = async () => {
    const val = parseFloat(pointsPerQarInput);
    if (isNaN(val) || val <= 0) {
      addError(new Error('Points rate must be a positive number.'), 'Loyalty Rate');
      return;
    }
    setSavingRate(true);
    try {
      await updateMerchantSettings.mutateAsync({ pointsPerQar: val });
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2000);
    } catch (err: any) {
      addError(new Error(err?.message || 'Failed to save rate'), 'Loyalty Rate');
    } finally {
      setSavingRate(false);
    }
  };

  const onSubmit = (data: RewardFormData) => {
    setFormError('');
    if (rewardType === 'points' && (!data.pointsCost || data.pointsCost < 1)) {
      setFormError('Points cost must be at least 1.');
      return;
    }
    if (rewardType === 'stamps' && (!data.stampsCost || data.stampsCost < 1)) {
      setFormError('Stamps required must be at least 1.');
      return;
    }

    const payload = {
      name: data.name,
      description: data.description,
      rewardType,
      type: 'fixed' as const,
      pointsCost: rewardType === 'points' ? data.pointsCost : undefined,
      stampsCost: rewardType === 'stamps' ? data.stampsCost : undefined,
    };

    if (editingReward) {
      updateReward.mutate(
        { id: editingReward.id, ...payload },
        {
          onSuccess: () => { setIsCreateOpen(false); setEditingReward(null); reset(); },
          onError: (error: any) => {
            const msg = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Failed to update reward';
            addError(new Error(`Unable to update reward: ${msg}`), 'Reward Update Error');
          },
        }
      );
    } else {
      createReward.mutate(payload, {
        onSuccess: () => { setIsCreateOpen(false); reset(); },
        onError: (error: any) => {
          const msg = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Failed to create reward';
          addError(new Error(`Unable to create reward: ${msg}`), 'Reward Creation Error');
        },
      });
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    const type: RewardType = reward.rewardType === 'stamps' ? 'stamps' : 'points';
    setRewardType(type);
    setFormError('');
    reset({
      name: reward.name,
      description: reward.description,
      pointsCost: type === 'points' ? toNumber(reward.pointsCost) : undefined,
      stampsCost: type === 'stamps' ? reward.stampsCost : undefined,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: string) => {
    setRewardToDelete(rewards?.find((r) => r.id === id) || null);
  };

  const confirmDeleteReward = () => {
    if (!rewardToDelete) return;
    deleteReward.mutate(rewardToDelete.id, {
      onSuccess: () => setRewardToDelete(null),
      onError: (error: any) => {
        const msg = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Failed to delete reward';
        const friendlyMessage = msg.includes('redeemed') || msg.includes('redemption')
          ? 'This reward cannot be deleted because customers have already redeemed it. Please deactivate it instead.'
          : msg.includes('not found') || msg.includes('404')
          ? 'This reward no longer exists. Please refresh the page.'
          : `Unable to delete reward: ${msg}`;
        addError(new Error(friendlyMessage), 'Reward Deletion Error');
      },
    });
  };

  const openCreate = () => {
    setEditingReward(null);
    setRewardType('points');
    setFormError('');
    reset({});
    setIsCreateOpen(true);
  };

  const closeDialog = () => {
    setIsCreateOpen(false);
    setEditingReward(null);
    reset();
    setFormError('');
  };

  // Live math previews
  const pointsPreview = (() => {
    const pts = Number(watchedPointsCost);
    if (!pts || pts < 1 || effectiveRate <= 0) return null;
    const spend = Math.ceil(pts / effectiveRate);
    return `At your rate of ${effectiveRate} pt${effectiveRate !== 1 ? 's' : ''}/QAR, a customer must spend ${spend} QAR to earn this reward.`;
  })();

  const stampsPreview = (() => {
    const s = Number(watchedStampsCost);
    if (!s || s < 1) return null;
    return `A customer earns 1 stamp per transaction. After ${s} visit${s !== 1 ? 's' : ''}, they will receive this reward.`;
  })();

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Gift className="h-8 w-8 text-purple-400" />
            Rewards
          </h1>
          <p className="text-slate-400">Create and manage rewards for your customers</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Reward
        </Button>
      </div>

      {/* Loyalty Program Settings Card */}
      <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-white">
            <Settings2 className="h-4 w-4 text-blue-400" />
            Loyalty Program Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-300">For every 1 QAR a customer spends, they earn</span>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={pointsPerQarInput}
              onChange={(e) => { setPointsPerQarInput(e.target.value); setRateSaved(false); }}
              className="w-24 text-center font-bold text-white bg-slate-800/60 border-slate-600"
            />
            <span className="text-sm text-slate-300">points.</span>
            <Button
              onClick={handleSaveRate}
              disabled={savingRate}
              size="sm"
              className={cn(
                'whitespace-nowrap',
                rateSaved
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : ''
              )}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {savingRate ? 'Saving…' : rateSaved ? 'Saved!' : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Example: with a rate of {effectiveRate}, a 100 QAR purchase earns {Math.floor(100 * effectiveRate)} points.
          </p>
        </CardContent>
      </Card>

      {/* Rewards Grid */}
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
                onClick={openCreate}
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
          {rewards?.map((reward) => {
            const isStamps = reward.rewardType === 'stamps';
            return (
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
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={reward.isActive ? 'success' : 'secondary'} className="text-xs">
                          {reward.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            isStamps ? 'border-amber-500/40 text-amber-400' : 'border-purple-500/40 text-purple-400'
                          )}
                        >
                          {isStamps ? 'Stamp Card' : 'Points'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed min-h-[48px]">
                    {reward.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="flex items-baseline gap-2">
                      {isStamps ? (
                        <Stamp className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-purple-400" />
                      )}
                      <div>
                        <div className={cn('text-3xl font-bold', isStamps ? 'text-amber-400' : 'text-purple-400')}>
                          {isStamps ? (reward.stampsCost ?? '—') : toNumber(reward.pointsCost)}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">
                          {isStamps ? 'stamps' : 'points'}
                        </div>
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
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setIsCreateOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingReward ? 'Edit Reward' : 'Create New Reward'}
            </DialogTitle>
            <DialogClose onClose={closeDialog} />
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
            {/* Reward Type Toggle */}
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Reward Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setRewardType('points'); setFormError(''); }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-semibold transition-all',
                    rewardType === 'points'
                      ? 'border-purple-500/60 bg-purple-500/15 text-purple-300'
                      : 'border-white/10 bg-slate-800/40 text-slate-400 hover:border-white/20'
                  )}
                >
                  <Sparkles className="h-5 w-5" />
                  Points-Based
                </button>
                <button
                  type="button"
                  onClick={() => { setRewardType('stamps'); setFormError(''); }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-semibold transition-all',
                    rewardType === 'stamps'
                      ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                      : 'border-white/10 bg-slate-800/40 text-slate-400 hover:border-white/20'
                  )}
                >
                  <Stamp className="h-5 w-5" />
                  Stamp Card
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Reward Name <span className="text-red-400">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="e.g., Free Coffee"
                className="bg-slate-800/50 border-slate-700 focus:border-purple-500"
              />
              {errors.name && <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Description <span className="text-red-400">*</span>
              </label>
              <Input
                {...register('description')}
                placeholder="e.g., Redeem for one free coffee"
                className="bg-slate-800/50 border-slate-700 focus:border-purple-500"
              />
              {errors.description && <p className="text-sm text-red-400 mt-1">{errors.description.message}</p>}
            </div>

            {/* Dynamic cost field + preview */}
            {rewardType === 'points' ? (
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">
                  Points Required <span className="text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  {...register('pointsCost')}
                  placeholder="e.g., 100"
                  min="1"
                  className="bg-slate-800/50 border-slate-700 focus:border-purple-500"
                />
                {pointsPreview && (
                  <p className="text-xs text-purple-400 mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    {pointsPreview}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">
                  Stamps Required <span className="text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  {...register('stampsCost')}
                  placeholder="e.g., 6"
                  min="1"
                  className="bg-slate-800/50 border-slate-700 focus:border-amber-500"
                />
                {stampsPreview && (
                  <p className="text-xs text-amber-400 mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    {stampsPreview}
                  </p>
                )}
              </div>
            )}

            {formError && (
              <p className="text-sm text-red-400 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button type="button" variant="outline" onClick={closeDialog} className="hover:bg-slate-700">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createReward.isPending || updateReward.isPending}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
              >
                {createReward.isPending || updateReward.isPending
                  ? 'Saving...'
                  : editingReward
                  ? 'Update Reward'
                  : 'Create Reward'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!rewardToDelete}
        title="Delete Reward"
        description={
          rewardToDelete
            ? `Delete "${rewardToDelete.name}"? This action cannot be undone and may affect future redemptions.`
            : ''
        }
        confirmLabel="Delete Reward"
        cancelLabel="Keep Reward"
        tone="danger"
        isLoading={deleteReward.isPending}
        onCancel={() => setRewardToDelete(null)}
        onConfirm={confirmDeleteReward}
      />
    </div>
  );
}
