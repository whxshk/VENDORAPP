import { useState } from 'react';
import { useDashboardSummary } from '../../hooks/useDashboardSummary';
import { useMerchantSettings } from '../../hooks/useMerchant';
import { KPICard } from '../../components/dashboard/KPICard';
import { AlertsWidget } from '../../components/dashboard/AlertsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select } from '../../components/ui/select';
import { Users, Repeat, Receipt, TrendingUp, Building2 } from 'lucide-react';
import { formatDateTime, toNumber } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';

export default function DashboardHome() {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const { data, isLoading, error } = useDashboardSummary(selectedLocationId || undefined);
  const { data: merchant } = useMerchantSettings();

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
  const todaysCustomers = data.todaysCustomers || 0;
  const repeatCustomers = data.repeatCustomers || 0;
  const totalTransactions = data.totalTransactions || 0;
  const redemptionRate = data.redemptionRate || 0;

  const branches = merchant?.branches || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard Overview
          </h1>
          <p className="text-slate-400">Welcome back! Here's what's happening with your business.</p>
        </div>
        {branches.length > 0 && (
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-slate-400" />
            <Select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="min-w-[200px]"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Today's Customers"
          value={todaysCustomers}
          description="Unique customers with transactions today"
          icon={<Users className="h-6 w-6" />}
          index={0}
        />
        <KPICard
          title="Repeat Customers"
          value={repeatCustomers}
          description={`${todaysCustomers > 0 ? Math.round((repeatCustomers / todaysCustomers) * 100) : 0}% of today's customers are repeat visitors`}
          icon={<Repeat className="h-6 w-6" />}
          index={1}
        />
        <KPICard
          title="Total Transactions"
          value={totalTransactions}
          description="All time transactions"
          icon={<Receipt className="h-6 w-6" />}
          index={2}
        />
        <KPICard
          title="Redemption Rate"
          value={`${redemptionRate}%`}
          description="Points redeemed vs issued"
          icon={<TrendingUp className="h-6 w-6" />}
          index={3}
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
                  {recentActivity.map((tx, index) => (
                    <tr 
                      key={tx.id} 
                      className="group hover:bg-gradient-to-r hover:from-blue-500/10 hover:via-purple-500/5 hover:to-transparent transition-all duration-300 ease-out hover:shadow-lg hover:shadow-blue-500/5"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="py-4 px-6 text-sm font-medium text-white transition-transform duration-300 group-hover:translate-x-1">{tx.customerName}</td>
                      <td className="py-4 px-6 transition-transform duration-300 group-hover:translate-x-1">
                        <Badge
                          variant={tx.type === 'earn' ? 'success' : 'destructive'}
                        >
                          {tx.type === 'earn' ? 'Earn' : 'Redeem'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-right font-semibold transition-transform duration-300 group-hover:translate-x-1">
                        <span className={toNumber(tx.points) > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {toNumber(tx.points) > 0 ? '+' : ''}
                          {toNumber(tx.points)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400 transition-transform duration-300 group-hover:translate-x-1">
                        {tx.staffName}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400 transition-transform duration-300 group-hover:translate-x-1">
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
