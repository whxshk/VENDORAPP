import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { simulateScan } from '../../api/merchant';
import { useRewards } from '../../hooks/useRewards';
import { useCustomers } from '../../hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { ScanLine, CheckCircle2, XCircle } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import type { SimulateScanParams, ScanResult, Transaction } from '../../api/types';

export default function ScanPage() {
  const [customerId, setCustomerId] = useState('');
  const [scanType, setScanType] = useState<'earn' | 'redeem'>('earn');
  const [amount, setAmount] = useState('');
  const [rewardId, setRewardId] = useState('');
  const [scanLogs, setScanLogs] = useState<Array<Transaction & { result: 'success' | 'error'; error?: string }>>([]);
  
  const { data: rewards } = useRewards();
  const { data: customersData } = useCustomers({ limit: 100 });
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: (params: SimulateScanParams) => simulateScan(params),
    onSuccess: (result: ScanResult) => {
      if (result.success && result.transaction) {
        setScanLogs(prev => [{
          ...result.transaction!,
          result: 'success' as const,
        }, ...prev.slice(0, 9)]);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        setCustomerId('');
        setAmount('');
        setRewardId('');
      } else {
        setScanLogs(prev => [{
          id: `error-${Date.now()}`,
          customerId: customerId,
          customerName: customersData?.data.find(c => c.id === customerId)?.name || 'Unknown',
          type: scanType,
          points: 0,
          staffId: 'staff-1',
          staffName: 'Current User',
          timestamp: new Date(),
          status: 'failed',
          result: 'error' as const,
          error: result.error,
        }, ...prev.slice(0, 9)]);
      }
    },
  });

  const handleScan = () => {
    if (!customerId) return;

    if (scanType === 'earn' && !amount) return;
    if (scanType === 'redeem' && !rewardId) return;

    scanMutation.mutate({
      customerId,
      type: scanType,
      amount: scanType === 'earn' ? parseFloat(amount) : undefined,
      rewardId: scanType === 'redeem' ? rewardId : undefined,
    });
  };

  const selectedCustomer = customersData?.data.find(c => c.id === customerId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Process Scan</h1>
        <p className="text-slate-400">Scan customer QR codes to issue points or redeem rewards</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-blue-400" />
            Scan Transaction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Input */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Customer QR or ID</label>
            <Input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Enter QR code or customer ID"
            />
            {selectedCustomer && (
              <div className="mt-2 text-sm text-slate-400">
                Customer: <span className="text-white font-medium">{selectedCustomer.name}</span> ({selectedCustomer.pointsBalance} pts)
              </div>
            )}
          </div>

          {/* Action Type */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Action</label>
            <div className="flex gap-3">
              <Button
                variant={scanType === 'earn' ? 'default' : 'outline'}
                onClick={() => {
                  setScanType('earn');
                  setRewardId('');
                }}
                className="flex-1"
              >
                Issue Points
              </Button>
              <Button
                variant={scanType === 'redeem' ? 'default' : 'outline'}
                onClick={() => {
                  setScanType('redeem');
                  setAmount('');
                }}
                className="flex-1"
              >
                Redeem Reward
              </Button>
            </div>
          </div>

          {/* Amount or Reward */}
          {scanType === 'earn' ? (
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Purchase Amount (QAR)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
              {amount && (
                <div className="mt-2 text-sm text-emerald-400 font-medium">
                  +{Math.floor(parseFloat(amount) * 0.5)} points to be issued
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Select Reward</label>
              <Select
                value={rewardId}
                onChange={(e) => setRewardId(e.target.value)}
              >
                <option value="">Select a reward</option>
                {rewards?.map((reward) => (
                  <option key={reward.id} value={reward.id}>
                    {reward.name} ({reward.pointsCost} pts)
                  </option>
                ))}
              </Select>
              {selectedCustomer && rewardId && (
                <div className="mt-2 text-sm">
                  {selectedCustomer.pointsBalance >= (rewards?.find(r => r.id === rewardId)?.pointsCost || 0) ? (
                    <span className="text-emerald-400 font-medium">✓ Sufficient points</span>
                  ) : (
                    <span className="text-red-400 font-medium">✗ Insufficient points</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <Button
            onClick={handleScan}
            disabled={!customerId || scanMutation.isPending || (scanType === 'earn' && !amount) || (scanType === 'redeem' && !rewardId)}
            className="w-full"
            size="lg"
          >
            {scanMutation.isPending ? 'Processing...' : 'Confirm Transaction'}
          </Button>

          {scanMutation.isError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {(scanMutation.error as Error)?.message || 'Scan failed'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
        </CardHeader>
        <CardContent>
          {scanLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No scans yet today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scanLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {log.result === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                    <div>
                      <div className="font-semibold text-white">{log.customerName}</div>
                      <div className="text-sm text-slate-400">
                        {log.result === 'success' ? (
                          <>
                            {log.type === 'earn' ? 'Issued' : 'Redeemed'} {Math.abs(log.points)} points
                          </>
                        ) : (
                          log.error || 'Failed'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    {formatDateTime(log.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
