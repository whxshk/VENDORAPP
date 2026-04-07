import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { configureOnboarding, completeOnboarding } from '../api/merchant';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

type LoyaltyType = 'POINTS' | 'STAMPS' | 'DISCOUNT';

const STEPS = ['Loyalty Type', 'Configure', 'Finish'];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 0 — loyalty type
  const [loyaltyType, setLoyaltyType] = useState<LoyaltyType | null>(null);

  // Step 1 — dynamic based on loyaltyType
  const [pointsPerQar, setPointsPerQar] = useState('0.5');
  const [discountPer100, setDiscountPer100] = useState('10');
  const [stampsRequired, setStampsRequired] = useState('10');
  const [stampReward, setStampReward] = useState('Free item');
  const [rewardName, setRewardName] = useState('Free Coffee');
  const [rewardPoints, setRewardPoints] = useState('100');

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleStep0 = () => {
    if (!loyaltyType) { setError('Please select a loyalty type'); return; }
    setError('');
    goNext();
  };

  const handleStep1 = async () => {
    if (!loyaltyType) return;
    setError('');
    setLoading(true);
    try {
      const rewards =
        loyaltyType === 'POINTS' && rewardName
          ? [{ name: rewardName, pointsRequired: parseInt(rewardPoints) || 100 }]
          : [];

      await configureOnboarding({
        loyaltyType,
        pointsPerQar: loyaltyType === 'POINTS' ? parseFloat(pointsPerQar) || 0.5 : undefined,
        discountPer100: loyaltyType === 'DISCOUNT' ? parseFloat(discountPer100) || 10 : undefined,
        stampsRequired: loyaltyType === 'STAMPS' ? parseInt(stampsRequired) || 10 : undefined,
        stampReward: loyaltyType === 'STAMPS' ? stampReward || 'Free item' : undefined,
        rewards,
      });
      goNext();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to configure loyalty program');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setError('');
    setLoading(true);
    try {
      await completeOnboarding();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Welcome to SharkBand
          </h1>
          <p className="text-slate-400 text-sm">Let's set up your loyalty program</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    i < step
                      ? 'bg-emerald-500 text-white'
                      : i === step
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-400',
                  )}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={cn('text-xs hidden sm:block', i === step ? 'text-white' : 'text-slate-500')}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px w-8 mb-5', i < step ? 'bg-emerald-500' : 'bg-slate-700')} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 0 — Loyalty Type */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">Choose Loyalty Type</h2>
              <div className="space-y-3">
                {(
                  [
                    {
                      type: 'POINTS' as LoyaltyType,
                      title: 'Points per Purchase',
                      desc: 'Customers earn points on every spend and redeem them for rewards.',
                      color: 'blue',
                    },
{
                      type: 'STAMPS' as LoyaltyType,
                      title: 'Stamp Card',
                      desc: 'Customers collect stamps and earn a free reward after N visits.',
                      color: 'purple',
                    },
                  ] as const
                ).map(({ type, title, desc, color }) => (
                  <button
                    key={type}
                    onClick={() => setLoyaltyType(type)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all',
                      loyaltyType === type
                        ? `border-${color}-500/60 bg-${color}-500/10`
                        : 'border-white/10 bg-slate-800/40 hover:border-white/20',
                    )}
                  >
                    <div className="font-semibold text-white">{title}</div>
                    <div className="text-sm text-slate-400 mt-1">{desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStep0} className="flex-1" size="lg">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 1 — Configure */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">Configure Your Program</h2>

              {loyaltyType === 'POINTS' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Points per QAR spent
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={pointsPerQar}
                      onChange={(e) => setPointsPerQar(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      e.g. 0.5 means 50 QAR spend earns 25 points
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Starter Reward Name
                    </label>
                    <Input
                      value={rewardName}
                      onChange={(e) => setRewardName(e.target.value)}
                      placeholder="e.g. Free Coffee"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Points Required for Reward
                    </label>
                    <Input
                      type="number"
                      value={rewardPoints}
                      onChange={(e) => setRewardPoints(e.target.value)}
                    />
                  </div>
                </>
              )}

              {loyaltyType === 'DISCOUNT' && (
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Discount per 100 QAR spent (%)
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    max="50"
                    value={discountPer100}
                    onChange={(e) => setDiscountPer100(e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    e.g. 10 means customers get 10 QAR back for every 100 QAR spent
                  </p>
                </div>
              )}

              {loyaltyType === 'STAMPS' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Stamps required for reward
                    </label>
                    <Input
                      type="number"
                      min="2"
                      value={stampsRequired}
                      onChange={(e) => setStampsRequired(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Reward after completing stamp card
                    </label>
                    <Input
                      value={stampReward}
                      onChange={(e) => setStampReward(e.target.value)}
                      placeholder="e.g. Free coffee"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={goBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleStep1} disabled={loading} className="flex-1" size="lg">
                  {loading ? 'Saving…' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Finish */}
          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-semibold text-white">You're all set!</h2>
              <p className="text-slate-400 text-sm">
                Your loyalty program is configured. Click below to go to your dashboard and start
                accepting customer scans.
              </p>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <Button onClick={handleFinish} disabled={loading} className="w-full" size="lg">
                {loading ? 'Finishing…' : 'Go to Dashboard'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
