/**
 * Top Redeemed Rewards.
 * DATA: 100% real. Derived from recentActivity redeem transactions by DashboardHome.
 * Formula: group redeemTxs by rewardName, count occurrences, sort descending.
 * Shows empty state if no named reward redemptions exist.
 */
import { Gift } from 'lucide-react';

interface RedeemedReward {
  name: string;
  count: number;
}

interface TopRedeemedRewardsCardProps {
  rewards: RedeemedReward[];
}

const ICON_COLORS = [
  { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.25)', color: '#fbbf24' },
  { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.25)', color: '#60a5fa' },
  { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.25)', color: '#a78bfa' },
  { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.25)', color: '#34d399' },
  { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.25)', color: '#f87171' },
];

export function TopRedeemedRewardsCard({ rewards }: TopRedeemedRewardsCardProps) {
  const cardStyle = {
    background: 'linear-gradient(160deg, rgba(168,85,247,0.04) 0%, #0d1424 45%, #0a0f1a 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    height: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
    display: 'flex',
    flexDirection: 'column' as const,
  };

  const totalRedemptions = rewards.reduce((s, r) => s + r.count, 0);

  const header = (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>Top Redeemed Rewards</h3>
      <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
        {totalRedemptions > 0
          ? `${totalRedemptions} redemption${totalRedemptions !== 1 ? 's' : ''} · from recent activity`
          : 'From recent activity'}
      </p>
    </div>
  );

  if (rewards.length === 0) {
    return (
      <div style={cardStyle}>
        {header}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '24px 16px',
            background: 'rgba(255,255,255,0.015)',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(168,85,247,0.08)',
              border: '1px solid rgba(168,85,247,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7c3aed',
            }}
          >
            <Gift size={20} />
          </div>
          <p style={{ color: '#475569', fontSize: '13px', fontWeight: 700, margin: 0, textAlign: 'center' }}>
            No Reward Data Yet
          </p>
          <p style={{ color: '#334155', fontSize: '11px', margin: 0, textAlign: 'center', lineHeight: 1.5, maxWidth: '220px' }}>
            Top redeemed rewards will appear once customers redeem named rewards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {header}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {rewards.slice(0, 5).map((reward, i) => {
          const ic = ICON_COLORS[i % ICON_COLORS.length];
          const isFirst = i === 0;
          return (
            <div key={reward.name}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
                {/* Icon */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: ic.bg,
                    border: `1px solid ${ic.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: ic.color,
                    flexShrink: 0,
                  }}
                >
                  <Gift size={17} />
                </div>

                {/* Name + subtitle */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p
                    style={{
                      color: isFirst ? '#f1f5f9' : '#cbd5e1',
                      fontSize: isFirst ? '13px' : '12px',
                      fontWeight: isFirst ? 700 : 500,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {reward.name}
                  </p>
                  <p style={{ color: '#334155', fontSize: '11px', margin: '2px 0 0', fontWeight: 500 }}>
                    {reward.count} redemption{reward.count !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Count */}
                <span
                  style={{
                    color: ic.color,
                    fontWeight: 900,
                    fontSize: isFirst ? '16px' : '14px',
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums' as const,
                  }}
                >
                  {reward.count}×
                </span>
              </div>
              {i < Math.min(rewards.length, 5) - 1 && (
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
