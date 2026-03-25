/**
 * Branch activity breakdown.
 * DATA: 100% real. Grouped from actual branchName field in recentActivity by DashboardHome.
 * Shows empty state if branch data is missing or insufficient.
 */
import { MapPin } from 'lucide-react';
import { EmptyAnalyticsCard } from '../EmptyAnalyticsCard';

interface BranchBucket {
  name: string;
  count: number;
}

interface BranchActivityCardProps {
  branchActivity: BranchBucket[];
  totalTransactions: number;
}

const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

export function BranchActivityCard({ branchActivity: branches = [], totalTransactions }: BranchActivityCardProps) {
  // Only show branches with actual location names (not "System" only)
  const realBranches = branches.filter(b => b.name !== 'System');

  if (realBranches.length === 0) {
    return (
      <EmptyAnalyticsCard
        title="No Branch Breakdown"
        message="Branch activity will appear once transactions from multiple locations are recorded."
        icon={<MapPin size={20} />}
        hint="Add locations in Settings to enable per-branch reporting."
        minHeight={200}
      />
    );
  }

  const maxCount = branches[0]?.count || 1;

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(59,130,246,0.04) 0%, #0d1424 40%, #0a0f1a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        height: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>Branch Activity</h3>
        <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
          By location · {totalTransactions} total transaction{totalTransactions !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {branches.map((b, i) => {
          const pct = Math.round((b.count / maxCount) * 100);
          const txPct = Math.round((b.count / totalTransactions) * 100);
          const color = BAR_COLORS[i % BAR_COLORS.length];
          const isSystem = b.name === 'System';

          return (
            <div key={b.name}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin
                    size={13}
                    style={{ color: isSystem ? '#334155' : color, flexShrink: 0 }}
                  />
                  <span
                    style={{
                      color: isSystem ? '#475569' : '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: isSystem ? 500 : 600,
                    }}
                  >
                    {b.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                    {b.count}
                  </span>
                  <span
                    style={{
                      background: `${color}18`,
                      color: isSystem ? '#475569' : color,
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '6px',
                    }}
                  >
                    {txPct}%
                  </span>
                </div>
              </div>
              <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: '3px',
                    background: isSystem
                      ? 'rgba(255,255,255,0.12)'
                      : `linear-gradient(90deg, ${color}99, ${color})`,
                    boxShadow: isSystem ? 'none' : `0 0 6px ${color}40`,
                    transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
