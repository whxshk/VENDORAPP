import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scanApply, type ScanApplyParams } from '../../api/merchant';
import { useRewards } from '../../hooks/useRewards';
import { useTransactions } from '../../hooks/useTransactions';
import { useErrorHandlerContext } from '../../hooks/useErrorHandler';
import { useMerchantSettings } from '../../hooks/useMerchant';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { ScanLine, Camera, CheckCircle2, XCircle, MapPin, X, Stamp, Coins, Gift } from 'lucide-react';
import { formatDateTime, toNumber } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { Transaction } from '../../api/types';

// Three distinct UI actions, all mapping to 'PURCHASE' or 'REDEEM' on the backend
type Action = 'GIVE_POINTS' | 'ADD_STAMP' | 'REDEEM';

export default function ScanPage() {
  const [qrPayload, setQrPayload] = useState('');
  const [qrScanned, setQrScanned] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [rewardId, setRewardId] = useState('');
  const [stampRewardId, setStampRewardId] = useState('');
  const [sessionScanLogs] = useState<Array<Transaction & { result: 'success' | 'error'; error?: string }>>([]);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const scannerRef = useRef<any>(null);

  const { addError } = useErrorHandlerContext();
  const { data: rewards } = useRewards();

  // Derive loyalty capabilities from active reward configuration
  const hasPointRewards = (rewards ?? []).some((r: any) => !r.rewardType || r.rewardType === 'points');
  const hasStampRewards = (rewards ?? []).some((r: any) => r.rewardType === 'stamps');

  // Auto-select the first available action once rewards load
  useEffect(() => {
    if (action !== null || !rewards) return;
    if (hasStampRewards) setAction('ADD_STAMP');
    else setAction('GIVE_POINTS');
  }, [action, rewards, hasStampRewards]);
  const { data: merchant } = useMerchantSettings();
  const { data: recentTransactions, refetch: refetchTransactions } = useTransactions({ limit: 10 });
  const queryClient = useQueryClient();

  const closeCamera = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  // Camera: start scanner when modal opens
  useEffect(() => {
    if (!cameraOpen) return;

    const scanner = new Html5Qrcode('qr-reader-modal');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          setQrPayload(decodedText);
          setQrScanned(true);
          closeCamera();
        },
        undefined,
      )
      .catch(() => closeCamera());

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [cameraOpen, closeCamera]);

  const scanMutation = useMutation({
    mutationFn: (params: ScanApplyParams) => scanApply(params),
    onSuccess: (d) => {
      const msg =
        d.purpose === 'REDEEM'
          ? 'Redemption successful'
          : action === 'ADD_STAMP'
          ? 'Stamp issued successfully'
          : 'Points issued successfully';
      setScanResult(msg);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      refetchTransactions();
      setQrPayload('');
      setQrScanned(false);
      setPurchaseAmount('');
      setRewardId('');
      setStampRewardId('');
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to process scan';

      let friendlyMessage: string;
      if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
        friendlyMessage = 'Unable to connect to the server. Please ensure the backend is running.';
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('validation')) {
        friendlyMessage = 'Invalid QR code payload or transaction parameters.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        friendlyMessage = 'Customer or reward not found. Please verify the QR code is valid.';
      } else {
        friendlyMessage = `Scan failed: ${errorMessage}`;
      }

      setScanResult(`Error: ${friendlyMessage}`);
      addError(new Error(friendlyMessage), 'Scan Error');
    },
  });

  const handleScan = () => {
    if (!qrPayload.trim().replace(/\s+/g, '')) return;
    if (action === 'GIVE_POINTS' && !purchaseAmount) return;
    if (action === 'REDEEM' && !rewardId) return;
    setScanResult(null);

    // Both GIVE_POINTS and ADD_STAMP map to 'PURCHASE' on the backend
    scanMutation.mutate({
      qrPayload: qrPayload.trim().replace(/\s+/g, ''),
      purpose: action === 'REDEEM' ? 'REDEEM' : 'PURCHASE',
      amount: (action === 'GIVE_POINTS' || action === 'ADD_STAMP') && purchaseAmount
        ? parseFloat(purchaseAmount)
        : undefined,
      rewardId: action === 'REDEEM' ? rewardId : undefined,
      stampRewardId: action === 'ADD_STAMP' && stampRewardId ? stampRewardId : undefined,
    });
  };

  const isDisabled =
    !qrPayload.trim() ||
    !action ||
    scanMutation.isPending ||
    (action === 'GIVE_POINTS' && !purchaseAmount) ||
    (action === 'REDEEM' && !rewardId);

  const confirmLabel =
    action === 'ADD_STAMP'
      ? 'Confirm & Issue Stamp'
      : action === 'GIVE_POINTS'
      ? 'Confirm & Issue Points'
      : action === 'REDEEM'
      ? 'Confirm Redemption'
      : 'Processing…';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Process Scan</h1>
        <p className="text-slate-400">Scan a customer's QR code to process a transaction</p>
      </div>

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl p-4 w-full max-w-sm border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Scan QR Code</h3>
              <Button variant="outline" size="sm" onClick={closeCamera}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div id="qr-reader-modal" className="w-full rounded-lg overflow-hidden" />
            <p className="text-slate-400 text-xs text-center mt-3">
              Point your camera at the customer's QR code
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-blue-400" />
            Process Customer Scan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Step 1: QR */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">
              Step 1 — Scan Customer QR
            </label>
            {qrScanned ? (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  Customer verified
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors"
                  onClick={() => { setQrPayload(''); setQrScanned(false); setScanResult(null); }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-start">
                <textarea
                  className="flex-1 min-h-[80px] px-3 py-2 rounded-lg bg-slate-800 text-white placeholder-slate-500 text-sm resize-none"
                  style={{ border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                  value={qrPayload}
                  onChange={(e) => { setQrPayload(e.target.value); setQrScanned(false); }}
                  placeholder="Paste QR code from the customer app, or use the camera"
                />
                <Button
                  variant="outline"
                  onClick={() => setCameraOpen(true)}
                  className="shrink-0 flex-col gap-1 h-auto py-3 px-3"
                  title="Scan with camera"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-xs">Camera</span>
                </Button>
              </div>
            )}
          </div>

          {/* Step 2: Action — shown based on merchant's active reward configuration */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">
              Step 2 — What is this for?
            </label>
            {!rewards ? (
              <p className="text-xs text-slate-500 py-2">Loading reward configuration…</p>
            ) : (
              <div className={`grid gap-2 ${hasPointRewards && hasStampRewards ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {/* Give Points — only if merchant has point rewards */}
                {hasPointRewards && (
                  <button
                    onClick={() => { setAction('GIVE_POINTS'); setRewardId(''); setScanResult(null); }}
                    className={cn(
                      'flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all',
                      action === 'GIVE_POINTS'
                        ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400'
                        : 'bg-slate-800/40 border-white/10 text-slate-400 hover:border-white/20'
                    )}
                  >
                    <Coins className="h-5 w-5" />
                    <span className="text-xs font-semibold text-center">Give Points</span>
                  </button>
                )}

                {/* Add Stamp — only if merchant has stamp rewards */}
                {hasStampRewards && (
                  <button
                    onClick={() => { setAction('ADD_STAMP'); setRewardId(''); setStampRewardId(''); setScanResult(null); }}
                    className={cn(
                      'flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all',
                      action === 'ADD_STAMP'
                        ? 'bg-orange-500/15 border-orange-500/60 text-orange-400'
                        : 'bg-slate-800/40 border-white/10 text-slate-400 hover:border-white/20'
                    )}
                  >
                    <Stamp className="h-5 w-5" />
                    <span className="text-xs font-semibold text-center">Add Stamp</span>
                  </button>
                )}

                {/* Redeem Reward — always shown */}
                <button
                  onClick={() => { setAction('REDEEM'); setPurchaseAmount(''); setScanResult(null); }}
                  className={cn(
                    'flex flex-col items-center gap-2 py-4 px-2 rounded-xl border-2 transition-all',
                    action === 'REDEEM'
                      ? 'bg-purple-500/15 border-purple-500/60 text-purple-400'
                      : 'bg-slate-800/40 border-white/10 text-slate-400 hover:border-white/20'
                  )}
                >
                  <Gift className="h-5 w-5" />
                  <span className="text-xs font-semibold text-center">Redeem Reward</span>
                </button>
              </div>
            )}
          </div>

          {/* Step 3a: Give Points — requires purchase amount */}
          {action === 'GIVE_POINTS' && (
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Step 3 — Purchase Amount (QAR)
              </label>
              <Input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="e.g. 50"
                autoFocus
              />
              {merchant?.pointsPerQar && purchaseAmount && (
                <p className="text-xs text-slate-500 mt-1.5">
                  At <span className="text-emerald-400 font-semibold">{merchant.pointsPerQar} pts / QAR</span>
                  {' → '}customer will earn{' '}
                  <span className="text-emerald-400 font-semibold">
                    {Math.round(parseFloat(purchaseAmount) * (merchant.pointsPerQar ?? 1))} points
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Step 3b: Add Stamp — optional purchase amount + stamp reward selector */}
          {action === 'ADD_STAMP' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">
                  Step 3 — Select Stamp Reward
                </label>
                {(() => {
                  const stampRewards = rewards?.filter((r) => (r as any).rewardType === 'stamps') ?? [];
                  return stampRewards.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">
                      No stamp rewards configured yet. Add one in the Rewards page.
                    </p>
                  ) : (
                    <Select
                      value={stampRewardId}
                      onChange={(e) => setStampRewardId(e.target.value)}
                    >
                      <option value="">Choose a stamp reward…</option>
                      {stampRewards.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({(r as any).stampsCost ?? '?'} stamps)
                        </option>
                      ))}
                    </Select>
                  );
                })()}
              </div>
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">
                  Number of Stamps
                  <span className="text-slate-500 font-normal ml-2">optional, defaults to 1</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="e.g. 1"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Confirming will add{' '}
                  <span className="text-orange-400 font-semibold">
                    +{purchaseAmount && parseInt(purchaseAmount) > 1 ? parseInt(purchaseAmount) : 1} stamp{purchaseAmount && parseInt(purchaseAmount) > 1 ? 's' : ''}
                  </span>{' '}
                  to the customer's card.
                </p>
              </div>
            </div>
          )}

          {/* Step 3c: Redeem — select reward */}
          {action === 'REDEEM' && (
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Step 3 — Select Reward to Redeem
              </label>
              <Select
                value={rewardId}
                onChange={(e) => setRewardId(e.target.value)}
              >
                <option value="">Choose a reward…</option>
                {rewards?.map((r) => {
                  const rt = (r as any).rewardType || 'points';
                  const cost =
                    rt === 'stamps'
                      ? `${(r as any).stampsCost ?? '?'} stamps`
                      : `${toNumber((r as any).pointsRequired ?? (r as any).pointsCost)} pts`;
                  return (
                    <option key={r.id} value={r.id}>
                      {r.name} ({cost})
                    </option>
                  );
                })}
              </Select>
            </div>
          )}

          <Button
            onClick={handleScan}
            disabled={isDisabled}
            className="w-full"
            size="lg"
          >
            {scanMutation.isPending ? 'Processing…' : confirmLabel}
          </Button>

          {scanResult && (
            <div
              className={`p-3 rounded-lg border text-sm font-semibold ${
                scanResult.startsWith('Error') || scanResult.startsWith('Scan failed')
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {scanResult}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {(!recentTransactions?.data || recentTransactions.data.length === 0) &&
          sessionScanLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions?.data?.map((tx, index) => (
                <div
                  key={tx.id}
                  className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-800/30 hover:bg-gradient-to-r hover:from-slate-800/60 hover:via-blue-500/5 hover:to-slate-800/40 hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 ease-out hover:scale-[1.01]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {tx.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : tx.status === 'failed' ? (
                      <XCircle className="h-5 w-5 text-red-400" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-slate-400" />
                    )}
                    <div>
                      <div className="font-semibold text-white">{tx.customerName || 'Customer'}</div>
                      <div className="text-sm text-slate-400">
                        {tx.type === 'earn'
                          ? (tx as any).stampIssued
                            ? `Issued ${Math.abs(toNumber(tx.points))} stamp${Math.abs(toNumber(tx.points)) !== 1 ? 's' : ''}`
                            : `Issued ${Math.abs(toNumber(tx.points))} pts`
                          : `Redeemed${tx.rewardName ? ` — ${tx.rewardName}` : ' reward'}`}
                        {tx.type === 'earn' && !(tx as any).stampIssued && tx.amount && (
                          <span className="text-slate-500 ml-2">({toNumber(tx.amount)} QAR)</span>
                        )}
                      </div>
                      {tx.branchName && (
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {tx.branchName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">{formatDateTime(tx.timestamp)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
