import { useQuery } from '@tanstack/react-query';
import { getPilotReport } from '../api/merchant';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

export default function PilotReportPage() {
  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['pilot-report'],
    queryFn: () => getPilotReport(),
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const exportJson = () => {
    if (!report) return;
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pilot-report-${report?.week || 'current'}.json`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pilot Report</h1>
          <p className="text-slate-400">Weekly analytics and insights</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-700 rounded w-24 mb-4" />
                <div className="h-8 bg-slate-700 rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pilot Report</h1>
          <p className="text-slate-400">Weekly analytics and insights</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-400">
              Failed to load pilot report. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pilot Report - Week {report.week}</h1>
          <p className="text-slate-400">Weekly analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportJson} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {report.summary && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-400">✓ What Improved This Week</CardTitle>
            </CardHeader>
            <CardContent>
              {report.summary.improved && report.summary.improved.length > 0 ? (
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  {report.summary.improved.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">No improvements recorded this week.</p>
              )}
            </CardContent>
          </Card>

          {report.summary.needsFixing && report.summary.needsFixing.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-400">⚠️ What Needs Fixing Next</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  {report.summary.needsFixing.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {report.metrics && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Weekly Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">Active Customers</div>
                <div className="text-3xl font-bold text-white">{report.metrics.weekly.activeCustomers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">Repeat Customers</div>
                <div className="text-3xl font-bold text-white">{report.metrics.weekly.repeatCustomers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">Total Transactions</div>
                <div className="text-3xl font-bold text-white">{report.metrics.weekly.transactionsTotal}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">Redemption Rate</div>
                <div className="text-3xl font-bold text-blue-400">
                  {report.metrics.weekly.transactionsIssue > 0
                    ? ((report.metrics.weekly.transactionsRedeem / report.metrics.weekly.transactionsIssue) * 100).toFixed(1)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Customers</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Issues</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Redeems</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {report.metrics.daily && report.metrics.daily.length > 0 ? (
                      report.metrics.daily.map((day: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors duration-150">
                          <td className="py-4 px-6 text-sm text-white">{day.date || 'N/A'}</td>
                          <td className="py-4 px-6 text-sm text-right text-white">{day.activeCustomers || 0}</td>
                          <td className="py-4 px-6 text-sm text-right text-emerald-400">{day.transactionsIssue || 0}</td>
                          <td className="py-4 px-6 text-sm text-right text-purple-400">{day.transactionsRedeem || 0}</td>
                          <td
                            className={`py-4 px-6 text-sm text-right ${
                              (day.scanErrorsTotal || 0) > 0 ? 'text-red-400 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {day.scanErrorsTotal || 0}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 px-6 text-center text-slate-400">
                          No daily metrics available for this week
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {report.topRewards && report.topRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Rewards This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.topRewards.map((reward: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl border border-white/5 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                  <span className="font-semibold text-white">{reward.rewardName}</span>
                  <span className="text-slate-400">{reward.redemptionCount} redemptions</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
