/**
 * Points Flow summary card.
 * DATA: 100% real. Computed from recentActivity earn/redeem transactions by DashboardHome.
 * Issued = sum of earn points. Redeemed = sum of |redeem points|. Net = issued - redeemed.
 */

interface PointsFlowCardProps {
  issued: number;
  redeemed: number;
  stampsIssued: number;
  transactionCount: number;
}

export function PointsFlowCard({ issued, redeemed, stampsIssued, transactionCount }: PointsFlowCardProps) {
  const net = issued - redeemed;
  const isPositive = net >= 0;
  const maxVal = Math.max(issued, redeemed, 1);

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(59,130,246,0.05) 0%, #0d1424 40%, #0a0f1a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '22px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>Points Flow</h3>
        <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
          Computed from {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} · recent activity
        </p>
      </div>

      {/* Issued row */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Issued
          </span>
          <span style={{ color: '#34d399', fontWeight: 900, fontSize: '17px', fontVariantNumeric: 'tabular-nums' }}>
            +{issued.toLocaleString()}
          </span>
        </div>
        <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
          <div
            style={{
              height: '100%',
              width: `${(issued / maxVal) * 100}%`,
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #6ee7b7, #34d399)',
              boxShadow: '0 0 8px rgba(52,211,153,0.35)',
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
      </div>

      {/* Redeemed row */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Redeemed
          </span>
          <span style={{ color: '#f87171', fontWeight: 900, fontSize: '17px', fontVariantNumeric: 'tabular-nums' }}>
            -{redeemed.toLocaleString()}
          </span>
        </div>
        <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
          <div
            style={{
              height: '100%',
              width: `${(redeemed / maxVal) * 100}%`,
              borderRadius: '4px',
              background: 'linear-gradient(90deg, #fca5a5, #f87171)',
              boxShadow: '0 0 8px rgba(248,113,113,0.3)',
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />

      {/* Net + Stamps */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Net points */}
        <div
          style={{
            flex: 1,
            background: isPositive ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${isPositive ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
            borderRadius: '10px',
            padding: '10px 14px',
          }}
        >
          <p style={{ color: '#475569', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px 0' }}>
            Net Points
          </p>
          <p style={{ color: isPositive ? '#34d399' : '#f87171', fontWeight: 900, fontSize: '20px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {isPositive ? '+' : ''}{net.toLocaleString()}
          </p>
        </div>

        {/* Stamps issued */}
        {stampsIssued > 0 && (
          <div
            style={{
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '10px',
              padding: '10px 14px',
              minWidth: '90px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#475569', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px 0' }}>
              Stamps
            </p>
            <p style={{ color: '#fbbf24', fontWeight: 900, fontSize: '20px', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              +{stampsIssued}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
