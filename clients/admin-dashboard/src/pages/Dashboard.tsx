import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Users, Store, Receipt, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { StatCard, Card, SectionHeader, Spinner } from '../components/ui';
import { getMockPlatformStats, getMock7DayTransactions, MOCK_MERCHANTS } from '../api/mock/data';

const CATEGORY_COLORS: Record<string, string> = {
  cafe: '#60a5fa', restaurant: '#34d399', fitness: '#f472b6',
  beauty: '#a78bfa', retail: '#fb923c', grocery: '#4ade80', entertainment: '#facc15',
};

export default function Dashboard() {
  const [stats, setStats] = useState<ReturnType<typeof getMockPlatformStats> | null>(null);
  const [chartData, setChartData] = useState<ReturnType<typeof getMock7DayTransactions>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStats(getMockPlatformStats());
      setChartData(getMock7DayTransactions());
      setLoading(false);
    }, 400);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const redemptionRate = stats
    ? Math.round((stats.totalPointsRedeemed / stats.totalPointsIssued) * 100)
    : 0;

  const merchantsByCategory = MOCK_MERCHANTS.reduce<Record<string, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {});

  const topMerchants = [...MOCK_MERCHANTS]
    .sort((a, b) => b.totalTransactions - a.totalTransactions)
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader
        title="Platform Overview"
        subtitle="Real-time metrics across all merchants and customers"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Customers"
          value={stats!.totalCustomers}
          sub={`${stats!.totalActiveUsers} active`}
          icon={<Users className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="Total Merchants"
          value={stats!.totalRegisteredMerchants}
          sub={`${stats!.activeMerchants} active`}
          icon={<Store className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Total Scans"
          value={stats!.totalTransactions}
          sub="All time"
          icon={<Receipt className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Points Issued"
          value={stats!.totalPointsIssued.toLocaleString()}
          sub="Cumulative"
          icon={<TrendingUp className="h-5 w-5" />}
          color="amber"
        />
        <StatCard
          title="Points Redeemed"
          value={stats!.totalPointsRedeemed.toLocaleString()}
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
          <h2 className="text-sm font-bold text-slate-300 mb-5">Transaction Density — Last 7 Days</h2>
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
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
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
            {Object.entries(merchantsByCategory).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[cat] || '#94a3b8' }} />
                <span className="text-xs text-slate-400 capitalize flex-1">{cat}</span>
                <span className="text-xs font-bold text-slate-300">{count}</span>
                <div className="w-16 h-1.5 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / MOCK_MERCHANTS.length) * 100}%`, background: CATEGORY_COLORS[cat] || '#94a3b8' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top merchants + volume chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top merchants table */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-4">Top Merchants by Volume</h2>
          <div className="space-y-3">
            {topMerchants.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="w-5 text-xs font-black text-slate-600 text-right">{i + 1}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: `${CATEGORY_COLORS[m.category]}22`, color: CATEGORY_COLORS[m.category] || '#94a3b8' }}
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
              </div>
            ))}
          </div>
        </Card>

        {/* Points issued vs redeemed bar chart */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-300 mb-5">Points: Issued vs Redeemed</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={MOCK_MERCHANTS.slice(0, 5).map((m) => ({
                name: m.name.split(' ')[0],
                Issued: m.pointsIssued,
                Redeemed: m.pointsRedeemed,
              }))}
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
