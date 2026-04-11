import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Users, Store, Receipt, TrendingUp, TrendingDown, Activity, Sparkles } from 'lucide-react';
import { StatCard, Card, SectionHeader, Spinner, Badge } from '../components/ui';
import { getPlatformDashboard, type PlatformDashboardResponse } from '../api/platform';
import { listMerchants, type Merchant } from '../api/merchants';

const CATEGORY_COLORS: Record<string, string> = {
  cafe: '#60a5fa', restaurant: '#34d399', fitness: '#f472b6',
  beauty: '#a78bfa', retail: '#fb923c', grocery: '#4ade80', entertainment: '#facc15',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<PlatformDashboardResponse | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [response, merchantList] = await Promise.all([
          getPlatformDashboard(selectedMerchantId || undefined),
          listMerchants(),
        ]);
        if (!cancelled) {
          setDashboard(response);
          setMerchants(merchantList);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
            err?.message ||
            'Failed to load platform analytics.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [selectedMerchantId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="Platform Overview"
          subtitle="Cross-tenant platform analytics and forecasted operating signals"
        />
        <Card className="p-6">
          <p className="text-sm font-semibold text-red-400">Unable to load the admin dashboard.</p>
          <p className="text-xs text-slate-500 mt-1">{error || 'Unknown error'}</p>
        </Card>
      </div>
    );
  }

  const { stats, dailyTrend, merchantsByCategory, topMerchants, insights, scope } = dashboard;
  const redemptionRate = Math.round(stats.redemptionRate * 100);
  const chartData = dailyTrend.map((row) => ({
    ...row,
    total: row.earn + row.redeem,
    day: row.date.slice(5),
  }));
  const topMerchantBarData = topMerchants.map((merchant) => ({
    name: merchant.name.split(' ')[0],
    Issued: merchant.pointsIssued,
    Redeemed: merchant.pointsRedeemed,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader
        title="Platform Overview"
        subtitle={
          scope.merchantName
            ? `Verified metrics scoped to ${scope.merchantName}`
            : 'Verified platform metrics with deterministic 7-day forecasts'
        }
        action={(
          <div className="flex items-center gap-2">
            {scope.merchantName ? <Badge variant="blue">Scoped</Badge> : <Badge variant="green">All Merchants</Badge>}
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              className="h-10 min-w-[180px] rounded-lg text-sm bg-white/5 border border-white/10 text-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-admin-500/50"
            >
              <option value="">All merchants</option>
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </div>
        )}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          sub={`${stats.totalActiveUsers.toLocaleString()} active in 30 days`}
          icon={<Users className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Total Merchants"
          value={stats.totalRegisteredMerchants}
          sub={`${stats.activeMerchants.toLocaleString()} active`}
          icon={<Store className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Total Scans"
          value={stats.totalTransactions}
          sub="All time"
          icon={<Receipt className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Points Issued"
          value={stats.totalPointsIssued.toLocaleString()}
          sub="Cumulative"
          icon={<TrendingUp className="h-5 w-5" />}
          color="amber"
        />
        <StatCard
          title="Points Redeemed"
          value={stats.totalPointsRedeemed.toLocaleString()}
          sub="Cumulative"
          icon={<TrendingDown className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          title="Redemption Rate"
          value={`${redemptionRate}%`}
          sub="Redeem / Issue"
          icon={<Activity className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 7-day transaction area chart */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-5">Transaction Density — Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="earn-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="redeem-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#161e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area type="monotone" dataKey="earn" name="Earn" stroke="#34d399" strokeWidth={2} fill="url(#earn-grad)" dot={false} />
              <Area type="monotone" dataKey="redeem" name="Redeem" stroke="#d946ef" strokeWidth={2} fill="url(#redeem-grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Category breakdown */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-5">Merchants by Category</h2>
          <div className="space-y-3">
            {merchantsByCategory.length === 0 && (
              <p className="text-xs text-slate-500">No category data available for this scope.</p>
            )}
            {merchantsByCategory.map(({ category, count }) => (
              <div key={category} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[category] || '#94a3b8' }} />
                <span className="text-xs text-slate-400 capitalize flex-1">{category}</span>
                <span className="text-xs font-bold text-slate-300">{count}</span>
                <div className="w-16 h-1.5 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / Math.max(stats.totalRegisteredMerchants, 1)) * 100}%`, background: CATEGORY_COLORS[category] || '#94a3b8' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {insights.cards.map((card) => (
          <Card key={card.id} className="p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-admin-500/10 text-admin-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <Badge
                variant={
                  card.tone === 'positive'
                    ? 'green'
                    : card.tone === 'warning'
                      ? 'amber'
                      : 'blue'
                }
              >
                Forecast
              </Badge>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
            <p className="text-2xl font-black text-slate-100 mt-2">{card.value}</p>
            <p className="text-xs text-slate-500 mt-2">{card.detail}</p>
          </Card>
        ))}
      </div>

      {/* Top merchants + volume chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top merchants table */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-4">
            {scope.merchantName ? 'Selected Merchant Summary' : 'Top Merchants by Volume'}
          </h2>
          <div className="space-y-3">
            {topMerchants.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate(`/merchants/${m.id}`)}
                className="w-full flex items-center gap-3 text-left rounded-xl px-1 py-1 hover:bg-white/5 transition-colors"
              >
                <span className="w-5 text-xs font-black text-slate-600 text-right">{i + 1}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
                >
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-300 truncate">{m.name}</p>
                  <p className="text-[10px] text-slate-600">{m.totalCustomers} customers</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-300 tabular-nums">{m.totalTransactions.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-600">scans</p>
                </div>
              </button>
            ))}
            {topMerchants.length === 0 && (
              <p className="text-xs text-slate-500">No merchant activity yet for this selection.</p>
            )}
          </div>
        </Card>

        {/* Points issued vs redeemed bar chart */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-5">
            {scope.merchantName ? 'Selected Merchant: Issued vs Redeemed' : 'Points: Issued vs Redeemed'}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={topMerchantBarData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#161e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }}
              />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="Issued" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Redeemed" fill="#d946ef" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
