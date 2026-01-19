import { useDashboardSummary } from '../../hooks/useDashboardSummary';
import { KPICard } from '../../components/dashboard/KPICard';
import { AlertsWidget } from '../../components/dashboard/AlertsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Repeat, Receipt, TrendingUp } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';

export default function DashboardHome() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-24 mb-4" />
                <div className="h-8 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Failed to load dashboard data. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  // Ensure data has required properties with defaults
  const alerts = data.alerts || [];
  const recentActivity = data.recentActivity || [];
  const activeCustomers = data.activeCustomers || 0;
  const repeatCustomers = data.repeatCustomers || 0;
  const totalTransactions = data.totalTransactions || 0;
  const redemptionRate = data.redemptionRate || 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-slate-400">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Customers"
          value={activeCustomers}
          description="Total active customers"
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="Repeat Customers"
          value={repeatCustomers}
          description={`${activeCustomers > 0 ? Math.round((repeatCustomers / activeCustomers) * 100) : 0}% of active`}
          icon={<Repeat className="h-6 w-6" />}
        />
        <KPICard
          title="Total Transactions"
          value={totalTransactions}
          description="All time transactions"
          icon={<Receipt className="h-6 w-6" />}
        />
        <KPICard
          title="Redemption Rate"
          value={`${redemptionRate}%`}
          description="Points redeemed vs issued"
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && <AlertsWidget alerts={alerts} />}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Points</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentActivity.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors duration-150">
                      <td className="py-4 px-6 text-sm font-medium text-white">{tx.customerName}</td>
                      <td className="py-4 px-6">
                        <Badge
                          variant={tx.type === 'earn' ? 'success' : 'destructive'}
                        >
                          {tx.type === 'earn' ? 'Earn' : 'Redeem'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-right font-semibold">
                        <span className={tx.points > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {tx.points > 0 ? '+' : ''}
                          {tx.points}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400">
                        {tx.staffName}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400">
                        {formatDateTime(tx.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
