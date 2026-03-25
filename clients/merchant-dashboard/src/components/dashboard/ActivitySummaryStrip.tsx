import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { toNumber } from '../../lib/utils';

interface ActivitySummaryStripProps {
  recentActivity: Array<{ type: string; points: number | string | unknown; stampIssued?: boolean }>;
}

/**
 * Derived analytics strip computed from the real recentActivity data.
 * Shows earn total, redeem total, and net from the loaded activity window.
 * Clearly scoped to the activity shown — not a global all-time figure.
 */
export function ActivitySummaryStrip({ recentActivity }: ActivitySummaryStripProps) {
  const earnRows = recentActivity.filter(tx => tx.type === 'earn');
  const redeemRows = recentActivity.filter(tx => tx.type === 'redeem');
  const totalEarned = earnRows.reduce((s, tx) => s + Math.abs(toNumber(tx.points)), 0);
  const totalRedeemed = redeemRows.reduce((s, tx) => s + Math.abs(toNumber(tx.points)), 0);
  const net = totalEarned - totalRedeemed;

  return (
    <div
      className="grid grid-cols-3 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
    >
      {/* Earned */}
      <div className="px-5 py-4 flex items-center gap-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(52,211,153,0.12)' }}
        >
          <ArrowUpRight className="h-4.5 w-4.5 text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Points Issued</p>
          <p className="text-xl font-bold text-emerald-400 mt-0.5">+{totalEarned.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{earnRows.length} earn {earnRows.length === 1 ? 'transaction' : 'transactions'}</p>
        </div>
      </div>

      {/* Redeemed */}
      <div className="px-5 py-4 flex items-center gap-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(248,113,113,0.12)' }}
        >
          <ArrowDownRight className="h-4.5 w-4.5 text-red-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Points Redeemed</p>
          <p className="text-xl font-bold text-red-400 mt-0.5">-{totalRedeemed.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{redeemRows.length} redeem {redeemRows.length === 1 ? 'transaction' : 'transactions'}</p>
        </div>
      </div>

      {/* Net */}
      <div className="px-5 py-4 flex items-center gap-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.12)' }}
        >
          <Activity className="h-4.5 w-4.5 text-indigo-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Net Points</p>
          <p className={`text-xl font-bold mt-0.5 ${net >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
            {net >= 0 ? '+' : ''}{net.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">from {recentActivity.length} recent transactions</p>
        </div>
      </div>
    </div>
  );
}
