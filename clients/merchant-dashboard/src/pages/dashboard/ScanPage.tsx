import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { simulateScan, scanApply, type ScanApplyParams } from '../../api/merchant';
import { useRewards } from '../../hooks/useRewards';
import { useCustomers } from '../../hooks/useCustomers';
import { useErrorHandlerContext } from '../../hooks/useErrorHandler';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { ScanLine, CheckCircle2, XCircle } from 'lucide-react';
import { formatDateTime, toNumber } from '../../lib/utils';
import type { SimulateScanParams, ScanResult, Transaction } from '../../api/types';

export default function ScanPage() {
  const [customerId, setCustomerId] = useState('');
  const [scanType, setScanType] = useState<'earn' | 'redeem'>('earn');
  const [amount, setAmount] = useState('');
  const [rewardId, setRewardId] = useState('');
  const [scanLogs, setScanLogs] = useState<Array<Transaction & { result: 'success' | 'error'; error?: string }>>([]);

  const [qrPayload, setQrPayload] = useState('');
  const [scanTestPurpose, setScanTestPurpose] = useState<'CHECKIN' | 'PURCHASE' | 'REDEEM'>('CHECKIN');
  const [scanTestAmount, setScanTestAmount] = useState('');
  const [scanTestRewardId, setScanTestRewardId] = useState('');
  const [scanTestResult, setScanTestResult] = useState<string | null>(null);
  
  const { addError } = useErrorHandlerContext();
  const { data: rewards } = useRewards();
  const { data: customersData, refetch: refetchCustomers } = useCustomers({ limit: 100 });
  const queryClient = useQueryClient();

  // Track last successful transaction result to show updated balance
  const [lastTransactionResult, setLastTransactionResult] = useState<ScanResult | null>(null);

  // Find customer by ID or shortId - use useMemo to ensure it updates correctly
  const selectedCustomer = useMemo(() => {
    if (!customerId || !customersData?.data) return null;
    const trimmedId = customerId.trim();
    
    // Try exact match first (UUID or short ID)
    let customer = customersData.data.find(
      c => c.id === trimmedId || (c as any).shortId === trimmedId || c.qrCode === trimmedId
    );
    
    // If not found and it's a 4-digit number, try as short ID
    if (!customer && /^\d{4}$/.test(trimmedId)) {
      customer = customersData.data.find(
        c => (c as any).shortId === trimmedId
      );
    }
    
    // If we have a recent transaction result for this customer, use updated balance from it
    if (customer && lastTransactionResult?.success && lastTransactionResult.customer) {
      const resultCustomer = lastTransactionResult.customer;
      if (resultCustomer.id === customer.id) {
        return {
          ...customer,
          pointsBalance: resultCustomer.pointsBalance, // Use updated balance from transaction
        };
      }
    }
    
    return customer || null;
  }, [customerId, customersData?.data, lastTransactionResult]);

  const scanMutation = useMutation({
    mutationFn: (params: SimulateScanParams) => simulateScan(params),
    onSuccess: async (result: ScanResult) => {
      // Store the result to update selectedCustomer balance
      setLastTransactionResult(result);
      
      if (result.success && result.transaction) {
        // Use customer from result if available (most accurate), otherwise use selectedCustomer
        const transactionCustomer = result.customer || selectedCustomer;
        
        setScanLogs(prev => [{
          ...result.transaction!,
          customerName: result.transaction!.customerName || transactionCustomer?.name || 'Unknown',
          result: 'success' as const,
        }, ...prev.slice(0, 9)]);
        
        // Invalidate all queries to force refresh
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['customers'], exact: false }); // Invalidate all customer queries
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        
        // Refetch customers immediately to get updated balances
        await refetchCustomers();
        
        // Clear form after successful scan
        setCustomerId('');
        setAmount('');
        setRewardId('');
        // Clear transaction result after a delay so UI can show updated balance
        setTimeout(() => setLastTransactionResult(null), 2000);
      } else {
        // Use result.customer if available, otherwise use selectedCustomer
        const errorCustomer = result.customer || selectedCustomer;
        setScanLogs(prev => [{
          id: `error-${Date.now()}`,
          customerId: errorCustomer?.id || customerId,
          customerName: errorCustomer?.name || 'Unknown',
          type: scanType,
          points: 0,
          staffId: 'staff-1',
          staffName: 'Current User',
          timestamp: new Date(),
          status: 'failed',
          result: 'error' as const,
          error: result.error,
        }, ...prev.slice(0, 9)]);
        
        // Show user-friendly error message
        const errorMessage = result.error || 'Transaction failed';
        let friendlyMessage: string;
        if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
          friendlyMessage = `Customer ${errorCustomer?.name || 'Unknown'} does not have enough points to redeem this reward. Current balance: ${errorCustomer?.pointsBalance || 0} points.`;
        } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          friendlyMessage = 'Customer or reward not found. Please check the customer ID or reward selection.';
        } else if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
          friendlyMessage = 'Invalid transaction details. Please check all fields are correct.';
        } else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
          friendlyMessage = 'You do not have permission to perform this transaction. Please contact your administrator.';
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          friendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          friendlyMessage = `Transaction failed: ${errorMessage}`;
        }
        addError(new Error(friendlyMessage), 'Scan Transaction Error');
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message 
        || error?.response?.data?.message 
        || error?.message 
        || 'Failed to process scan';
      
      let friendlyMessage: string;
      if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
        friendlyMessage = 'Unable to connect to the server. Please check your internet connection and ensure the backend is running.';
      } else if (errorMessage.includes('timeout')) {
        friendlyMessage = 'The request took too long. Please try again.';
      } else if (errorMessage.includes('permission') || errorMessage.includes('403')) {
        friendlyMessage = 'You do not have permission to perform this transaction. Please contact your administrator.';
      } else {
        friendlyMessage = `Unable to process scan: ${errorMessage}`;
      }
      
      addError(new Error(friendlyMessage), 'Scan Error');
      
      // Also add to scan logs
      setScanLogs(prev => [{
        id: `error-${Date.now()}`,
        customerId: selectedCustomer?.id || customerId,
        customerName: selectedCustomer?.name || 'Unknown',
        type: scanType,
        points: 0,
        staffId: 'staff-1',
        staffName: 'Current User',
        timestamp: new Date(),
        status: 'failed',
        result: 'error' as const,
        error: friendlyMessage,
      }, ...prev.slice(0, 9)]);
    },
  });

  const handleScan = () => {
    if (!customerId || !selectedCustomer) {
      return;
    }

    if (scanType === 'earn' && !amount) return;
    if (scanType === 'redeem' && !rewardId) return;

    // Always use the selectedCustomer's ID to ensure we're using the resolved customer
    const actualCustomerId = selectedCustomer.id;

    scanMutation.mutate({
      customerId: actualCustomerId,
      type: scanType,
      amount: scanType === 'earn' ? parseFloat(amount) : undefined,
      rewardId: scanType === 'redeem' ? rewardId : undefined,
    });
  };

  const scanTestMutation = useMutation({
    mutationFn: (params: ScanApplyParams) => scanApply(params),
    onSuccess: (d) => {
      setScanTestResult(`Success: ${d.purpose}${d.customerId ? ` customer=${d.customerId.slice(0, 8)}...` : ''}${d.balance != null ? ` balance=${d.balance}` : ''}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message 
        || error?.response?.data?.message 
        || error?.message 
        || 'Failed to process scan test';
      
      let friendlyMessage: string;
      if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('ECONNREFUSED')) {
        friendlyMessage = 'Unable to connect to the server. Please check your internet connection and ensure the backend is running.';
      } else if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
        friendlyMessage = 'Invalid QR code payload or transaction parameters. Please check the QR code and try again.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        friendlyMessage = 'Customer or reward not found in the QR code. Please verify the QR code is valid.';
      } else {
        friendlyMessage = `Scan test failed: ${errorMessage}`;
      }
      
      setScanTestResult(`Error: ${friendlyMessage}`);
      addError(new Error(friendlyMessage), 'Scan Test Error');
    },
  });

  const handleScanTest = () => {
    if (!qrPayload.trim()) return;
    if (scanTestPurpose === 'PURCHASE' && !scanTestAmount) return;
    if (scanTestPurpose === 'REDEEM' && !scanTestRewardId) return;
    setScanTestResult(null);
    scanTestMutation.mutate({
      qrPayload: qrPayload.trim(),
      purpose: scanTestPurpose,
      amount: scanTestPurpose === 'PURCHASE' ? parseFloat(scanTestAmount) : undefined,
      rewardId: scanTestPurpose === 'REDEEM' ? scanTestRewardId : undefined,
    });
  };

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
              onBlur={(e) => setCustomerId(e.target.value.trim())}
              placeholder="Enter customer ID (e.g., 0001) or QR code"
            />
            {selectedCustomer && (
              <div className="mt-2 text-sm text-slate-400">
                Customer: <span className="text-white font-medium">{selectedCustomer.name}</span> ({toNumber(selectedCustomer.pointsBalance)} pts)
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
                    {reward.name} ({toNumber(reward.pointsCost)} pts)
                  </option>
                ))}
              </Select>
              {selectedCustomer && rewardId && (() => {
                const selectedReward = rewards?.find(r => r.id === rewardId);
                const pointsRequired = toNumber(selectedReward?.pointsCost);
                const hasEnough = toNumber(selectedCustomer.pointsBalance) >= pointsRequired;
                return (
                  <div className="mt-2 text-sm">
                    {hasEnough ? (
                      <span className="text-emerald-400 font-medium">✓ Sufficient points</span>
                    ) : (
                      <span className="text-red-400 font-medium">
                        ✗ Insufficient points. Customer has {toNumber(selectedCustomer.pointsBalance)} points, but reward requires {pointsRequired} points.
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {!selectedCustomer && customerId && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
              Customer not found. Please check the customer ID and try again.
            </div>
          )}

          {/* Confirm Button */}
          {(() => {
            const selectedReward = scanType === 'redeem' ? rewards?.find(r => r.id === rewardId) : null;
            const pointsRequired = toNumber(selectedReward?.pointsCost);
            const hasInsufficientPoints = scanType === 'redeem' && selectedCustomer ? toNumber(selectedCustomer.pointsBalance) < pointsRequired : false;
            
            return (
              <Button
                onClick={handleScan}
                disabled={
                  !customerId || 
                  !selectedCustomer || 
                  scanMutation.isPending || 
                  (scanType === 'earn' && !amount) || 
                  (scanType === 'redeem' && (!rewardId || hasInsufficientPoints))
                }
                className="w-full"
                size="lg"
              >
                {scanMutation.isPending ? 'Processing...' : 'Confirm Transaction'}
              </Button>
            );
          })()}

          {scanMutation.isError && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {(scanMutation.error as Error)?.message || 'Transaction failed. Please try again.'}
            </div>
          )}
          
          {scanMutation.isSuccess && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
              Transaction completed successfully!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Test (QR) - minimal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-blue-400" />
            Scan Test (QR)
          </CardTitle>
          <p className="text-sm text-slate-400 mt-1">Paste qrPayload from customer app, then Apply CHECKIN / PURCHASE / REDEEM.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">QR Payload</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 text-sm font-mono"
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder="Paste qrPayload from GET /customers/me/qr-token"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Purpose</label>
            <div className="flex gap-2">
              {(['CHECKIN', 'PURCHASE', 'REDEEM'] as const).map((p) => (
                <Button
                  key={p}
                  variant={scanTestPurpose === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScanTestPurpose(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
          {scanTestPurpose === 'PURCHASE' && (
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Amount</label>
              <Input
                type="number"
                value={scanTestAmount}
                onChange={(e) => setScanTestAmount(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>
          )}
          {scanTestPurpose === 'REDEEM' && (
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Reward</label>
              <Select
                value={scanTestRewardId}
                onChange={(e) => setScanTestRewardId(e.target.value)}
              >
                <option value="">Select reward</option>
                {rewards?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({toNumber((r as any).pointsRequired ?? r.pointsCost)} pts)</option>
                ))}
              </Select>
            </div>
          )}
          <Button
            onClick={handleScanTest}
            disabled={!qrPayload.trim() || scanTestMutation.isPending || (scanTestPurpose === 'PURCHASE' && !scanTestAmount) || (scanTestPurpose === 'REDEEM' && !scanTestRewardId)}
          >
            {scanTestMutation.isPending ? 'Applying...' : 'Apply'}
          </Button>
          {scanTestResult && (
            <div className="p-3 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-slate-300 font-mono">
              {scanTestResult}
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
              {scanLogs.map((log, index) => (
                <div
                  key={log.id}
                  className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-800/30 hover:bg-gradient-to-r hover:from-slate-800/60 hover:via-blue-500/5 hover:to-slate-800/40 hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 ease-out hover:scale-[1.01]"
                  style={{ animationDelay: `${index * 50}ms` }}
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
                            {log.type === 'earn' ? `Issued ${Math.abs(log.points)} points` : `Redeemed ${Math.abs(log.points)} points`}
                            {log.type === 'earn' && log.amount && (
                              <span className="text-slate-500 ml-2">({log.amount} QAR)</span>
                            )}
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
