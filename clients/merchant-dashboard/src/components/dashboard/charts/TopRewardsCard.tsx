/**
 * Top Rewards by redemption count.
 *
 * MOCK DATA: Replace `MOCK_TOP_REWARDS` with real API data when available.
 * Shape: { name: string; cost: string; count: number }[]
 */

// --- MOCK DATA (replace with real API data) ---
const MOCK_TOP_REWARDS = [
  { name: 'Free Coffee', cost: '150 pts', count: 42 },
  { name: '10% Off Next Order', cost: '500 pts', count: 28 },
  { name: 'Free Dessert', cost: '200 pts', count: 19 },
  { name: 'Double Points Day', cost: 'Free', count: 15 },
  { name: 'Birthday Special', cost: '100 pts', count: 11 },
];
// --- END MOCK DATA ---

const MAX_COUNT = MOCK_TOP_REWARDS[0].count;
const TOTAL_REDEEMS = MOCK_TOP_REWARDS.reduce((s, r) => s + r.count, 0);

// Per-rank styling
const RANK_STYLES = [
  {
    badge: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', shadow: '0 2px 8px rgba(245,158,11,0.4)' },
    bar: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
    barGlow: 'rgba(245,158,11,0.4)',
    label: '🥇',
  },
  {
    badge: { background: 'linear-gradient(135deg, #94a3b8, #64748b)', color: '#fff', shadow: '0 2px 6px rgba(100,116,139,0.3)' },
    bar: 'linear-gradient(90deg, #cbd5e1, #94a3b8)',
    barGlow: 'rgba(148,163,184,0.3)',
    label: '🥈',
  },
  {
    badge: { background: 'linear-gradient(135deg, #cd7c54, #b45309)', color: '#fff', shadow: '0 2px 6px rgba(180,83,9,0.3)' },
    bar: 'linear-gradient(90deg, #d97706, #b45309)',
    barGlow: 'rgba(180,83,9,0.3)',
    label: '🥉',
  },
  {
    badge: { background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', shadow: 'none' },
    bar: 'linear-gradient(90deg, #818cf8, #6366f1)',
    barGlow: 'rgba(99,102,241,0.25)',
    label: '#4',
  },
  {
    badge: { background: 'rgba(99,102,241,0.15)', color: '#818cf8', shadow: 'none' },
    bar: 'linear-gradient(90deg, #6366f1, #4f46e5)',
    barGlow: 'rgba(99,102,241,0.2)',
    label: '#5',
  },
];

export function TopRewardsCard() {
  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(168,85,247,0.05) 0%, #0d1424 40%, #0a0f1a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        height: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>Top Rewards</h3>
          <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>Most redeemed this period</p>
        </div>
        <div
          style={{
            background: 'rgba(168,85,247,0.1)',
            border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: '8px',
            padding: '4px 10px',
          }}
        >
          <span style={{ color: '#c084fc', fontSize: '11px', fontWeight: 800 }}>{TOTAL_REDEEMS} total</span>
        </div>
      </div>

      {/* Reward items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {MOCK_TOP_REWARDS.map((reward, i) => {
          const pct = Math.round((reward.count / MAX_COUNT) * 100);
          const rs = RANK_STYLES[i] || RANK_STYLES[4];
          const isTop = i === 0;
          return (
            <div key={reward.name}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {/* Rank badge */}
                <div
                  style={{
                    width: isTop ? '28px' : '24px',
                    height: isTop ? '28px' : '24px',
                    borderRadius: isTop ? '8px' : '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isTop ? '14px' : '11px',
                    fontWeight: 900,
                    flexShrink: 0,
                    background: rs.badge.background,
                    color: rs.badge.color,
                    boxShadow: rs.badge.shadow,
                  }}
                >
                  {rs.label}
                </div>

                {/* Name + cost */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: isTop ? '#f1f5f9' : '#cbd5e1',
                      fontSize: isTop ? '13px' : '12px',
                      fontWeight: isTop ? 700 : 600,
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {reward.name}
                  </p>
                  <p style={{ color: '#475569', fontSize: '10px', marginTop: '1px' }}>{reward.cost}</p>
                </div>

                {/* Count */}
                <span
                  style={{
                    fontSize: isTop ? '15px' : '13px',
                    fontWeight: 900,
                    color: isTop ? '#fbbf24' : '#94a3b8',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  {reward.count}
                </span>
              </div>

              {/* Progress bar — thicker, glowing */}
              <div
                style={{
                  height: isTop ? '6px' : '4px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: '4px',
                    background: rs.bar,
                    boxShadow: `0 0 8px ${rs.barGlow}`,
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
