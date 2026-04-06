/**
 * DashboardHome — SharkBand Merchant Dashboard
 *
 * DATA POLICY: All metrics and charts are derived exclusively from real API data.
 * No mock, fabricated, or demo data is used anywhere in this component.
 *
 * Data sources:
 *   - useDashboardSummary() → todaysCustomers, repeatCustomers, totalTransactions,
 *                             redemptionRate, recentActivity[], alerts[]
 *   - useMerchantSettings() → merchant name, branches[]
 *
 * Derived analytics (computed inline from recentActivity):
 *   - pointsIssued: sum of earn transaction points
 *   - pointsRedeemed: sum of redeem transaction points
 *   - earnCount / redeemCount / stampCount: transaction type totals
 *   - hourlyData: total transactions bucketed by hour (for Peak Hours chart)
 *   - earnRedeemData: earn vs redeem counts per hour (for grouped bar chart)
 *   - newCustomers: todaysCustomers - repeatCustomers
 *   - topRewards: redeemTxs grouped by rewardName, sorted descending
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardSummary } from '../../hooks/useDashboardSummary';
import { useMerchantSettings } from '../../hooks/useMerchant';
import { KPIStatCard } from '../../components/dashboard/KPIStatCard';
import { AlertsWidget } from '../../components/dashboard/AlertsWidget';
import { EarnVsRedeemChart } from '../../components/dashboard/charts/EarnVsRedeemChart';
import { PeakHoursChart } from '../../components/dashboard/charts/PeakHoursChart';
import { CustomerDonutChart } from '../../components/dashboard/charts/CustomerDonutChart';
import { TopRedeemedRewardsCard } from '../../components/dashboard/charts/TopRedeemedRewardsCard';
import { Select } from '../../components/ui/select';
import {
  Users, Receipt, TrendingUp, Building2,
  ArrowUpRight, ArrowDownRight, Stamp, ScanLine,
} from 'lucide-react';
import { formatDateTime, toNumber } from '../../lib/utils';

// ─── Sub-components ────────────────────────────────────────────────────────────
function LiveBadge() {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ background: '#34d399' }}
        />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#34d399' }} />
      </span>
      Live
    </div>
  );
}

function TypePill({ type, stampIssued }: { type: string; stampIssued?: boolean }) {
  if (stampIssued) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}
      >
        <Stamp className="h-2.5 w-2.5" />Stamp
      </span>
    );
  }
  if (type === 'earn') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
        style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}
      >
        <ArrowUpRight className="h-2.5 w-2.5" />Earn
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}
    >
      <ArrowDownRight className="h-2.5 w-2.5" />Redeem
    </span>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function SectionDivider({ label, badge }: { label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">{label}</h2>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.04)' }} />
      {badge && (
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#334155', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const { data, isLoading, error } = useDashboardSummary(selectedLocationId || undefined);
  const { data: merchant } = useMerchantSettings();
  const navigate = useNavigate();

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-80 rounded-xl bg-slate-800/60 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-2xl bg-slate-800/60 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-72 rounded-2xl bg-slate-800/40 animate-pulse" />
          <div className="h-72 rounded-2xl bg-slate-800/40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 rounded-2xl bg-slate-800/40 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-800/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl p-8 text-center text-red-400 text-sm"
        style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}
      >
        Unable to load dashboard data. Please refresh the page.
      </div>
    );
  }

  if (!data) return null;

  // ── Real data from API ──────────────────────────────────────────────────────
  const alerts = data.alerts || [];
  const recentActivity = data.recentActivity || [];
  const todaysCustomers = toNumber(data.todaysCustomers);
  const repeatCustomers = toNumber(data.repeatCustomers);
  const totalTransactions = toNumber(data.totalTransactions);
  const redemptionRate = toNumber(data.redemptionRate);
  const branches = merchant?.branches || [];

  // ── Derived analytics — computed from real recentActivity transactions ──────
  const earnTxs = recentActivity.filter(tx => tx.type === 'earn' && !tx.stampIssued);
  const redeemTxs = recentActivity.filter(tx => tx.type === 'redeem');

  const pointsIssued = earnTxs.reduce((s, tx) => s + Math.abs(toNumber(tx.points)), 0);
  const pointsRedeemed = redeemTxs.reduce((s, tx) => s + Math.abs(toNumber(tx.points)), 0);

  // Hourly buckets for Peak Hours chart — total transactions per hour
  const hourMap = new Map<number, number>();
  recentActivity.forEach(tx => {
    const h = new Date(tx.timestamp).getHours();
    hourMap.set(h, (hourMap.get(h) || 0) + 1);
  });
  const hourlyData = Array.from(hourMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([h, count]) => ({
      hour: `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`,
      count,
      sortKey: h,
    }));

  // Per-hour earn vs redeem — for grouped bar chart
  const hourEarnMap = new Map<number, number>();
  const hourRedeemMap = new Map<number, number>();
  recentActivity.forEach(tx => {
    const h = new Date(tx.timestamp).getHours();
    if (tx.type === 'earn' && !tx.stampIssued) {
      hourEarnMap.set(h, (hourEarnMap.get(h) || 0) + 1);
    } else if (tx.type === 'redeem') {
      hourRedeemMap.set(h, (hourRedeemMap.get(h) || 0) + 1);
    }
  });
  const allHours = new Set([...hourEarnMap.keys(), ...hourRedeemMap.keys()]);
  const earnRedeemData = Array.from(allHours)
    .sort((a, b) => a - b)
    .map(h => ({
      hour: `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`,
      earn: hourEarnMap.get(h) || 0,
      redeem: hourRedeemMap.get(h) || 0,
    }));

  // Customer breakdown — new vs returning
  const newCustomers = Math.max(0, todaysCustomers - repeatCustomers);

  // Top redeemed rewards — grouped by rewardName from real redeem transactions
  const rewardMap = new Map<string, number>();
  redeemTxs.forEach(tx => {
    const name = tx.rewardName;
    if (name) rewardMap.set(name, (rewardMap.get(name) || 0) + 1);
  });
  const topRewards = Array.from(rewardMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const redemptionPct = Math.round(redemptionRate * 100);

  return (
    <div className="space-y-8">

      {/* ── Scan CTA ───────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/dashboard/scan')}
        className="w-full flex items-center justify-center gap-4 py-6 rounded-2xl text-white font-black text-2xl tracking-tight shadow-2xl shadow-blue-500/30 transition-all duration-200 active:scale-[0.98] hover:shadow-blue-500/50 hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #6d28d9 100%)' }}
        aria-label="Go to Scan page"
      >
        <ScanLine className="h-8 w-8 shrink-0" strokeWidth={2.5} />
        Scan
      </button>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-1">Your Business Dashboard</h1>
          <p className="text-sm text-slate-500">
            Real-time insights for {merchant?.name || 'SharkBand'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <LiveBadge />
          {branches.length > 0 && (
            <>
              <Building2 className="h-4 w-4 text-slate-600 flex-shrink-0" />
              <Select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="text-sm"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </>
          )}
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

      {/* ── 5 KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPIStatCard
          title="Total Scans"
          value={totalTransactions}
          description="All-time transactions"
          icon={<Receipt className="h-5 w-5" />}
          theme="slate"
          trend={{ direction: 'up', label: 'All time' }}
          index={0}
        />
        <KPIStatCard
          title="Points Issued"
          value={pointsIssued}
          description="From recent activity"
          icon={<ArrowUpRight className="h-5 w-5" />}
          theme="emerald"
          trend={{ direction: 'up', label: `${earnTxs.length} txns` }}
          index={1}
        />
        <KPIStatCard
          title="Points Redeemed"
          value={pointsRedeemed}
          description="From recent activity"
          icon={<ArrowDownRight className="h-5 w-5" />}
          theme="rose"
          trend={{ direction: pointsRedeemed > 0 ? 'up' : 'flat', label: `${redeemTxs.length} txns` }}
          index={2}
        />
        <KPIStatCard
          title="Redemption Rate"
          value={`${redemptionPct}%`}
          description="Redeem / issue ratio"
          icon={<TrendingUp className="h-5 w-5" />}
          theme="purple"
          trend={{ direction: redemptionRate > 0.1 ? 'up' : 'flat', label: 'Rate' }}
          index={3}
        />
        <KPIStatCard
          title="Today's Customers"
          value={todaysCustomers}
          description="Unique visitors today"
          icon={<Users className="h-5 w-5" />}
          theme="amber"
          trend={{ direction: todaysCustomers > 0 ? 'up' : 'flat', label: 'Today' }}
          index={4}
        />
      </div>

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {alerts.length > 0 && <AlertsWidget alerts={alerts} />}

      {/* ── Analytics ──────────────────────────────────────────────────────── */}
      <SectionDivider label="Analytics" />

      {/* Row 1: Earn vs Redeem (2/3) + Peak Hours (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <EarnVsRedeemChart data={earnRedeemData} totalTransactions={recentActivity.length} />
        </div>
        <PeakHoursChart data={hourlyData} />
      </div>

      {/* Row 2: Customer Breakdown + Top Redeemed Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CustomerDonutChart returning={repeatCustomers} newCustomers={newCustomers} />
        <TopRedeemedRewardsCard rewards={topRewards} />
      </div>

      {/* ── Recent Activity ─────────────────────────────────────────────────── */}
      <SectionDivider label="Recent Activity" badge={`${recentActivity.length} transactions`} />

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #141c2e 0%, #0f172a 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        {recentActivity.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-600">No activity yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="text-right py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider hidden md:table-cell">Branch</th>
                  <th className="text-left py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Staff</th>
                  <th className="text-right py-3 px-5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((tx, index) => {
                  const pts = toNumber(tx.points);
                  const isStamp = tx.stampIssued === true;
                  const ptsColor = pts > 0 ? (isStamp ? 'text-amber-400' : 'text-emerald-400') : 'text-red-400';
                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: index < recentActivity.length - 1
                          ? '1px solid rgba(255,255,255,0.03)'
                          : 'none',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <CustomerAvatar name={tx.customerName} />
                          <span className="text-sm font-medium text-slate-200">{tx.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <TypePill type={tx.type} stampIssued={isStamp} />
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span className={`text-sm font-bold tabular-nums ${ptsColor}`}>
                          {pts > 0 ? '+' : ''}{pts}
                          {isStamp ? ` stamp${Math.abs(pts) !== 1 ? 's' : ''}` : ' pts'}
                        </span>
                      </td>
                      <td className="py-3 px-5 hidden md:table-cell">
                        <span className="text-xs text-slate-500">{tx.branchName || '—'}</span>
                      </td>
                      <td className="py-3 px-5 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{tx.staffName}</span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span className="text-[11px] text-slate-600 tabular-nums">{formatDateTime(tx.timestamp)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
