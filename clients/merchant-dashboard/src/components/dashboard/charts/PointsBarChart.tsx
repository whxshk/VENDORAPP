/**
 * Points Issued vs Redeemed — weekly bar chart.
 *
 * MOCK DATA: Replace `MOCK_WEEKLY_POINTS` with real API data when available.
 * Shape: { day: string; issued: number; redeemed: number }[]
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// --- MOCK DATA (replace with real API data) ---
const MOCK_WEEKLY_POINTS = [
  { day: 'Mon', issued: 120, redeemed: 45 },
  { day: 'Tue', issued: 85, redeemed: 30 },
  { day: 'Wed', issued: 200, redeemed: 80 },
  { day: 'Thu', issued: 155, redeemed: 62 },
  { day: 'Fri', issued: 310, redeemed: 115 },
  { day: 'Sat', issued: 275, redeemed: 98 },
  { day: 'Sun', issued: 180, redeemed: 58 },
];
// --- END MOCK DATA ---

const TOTAL_ISSUED = MOCK_WEEKLY_POINTS.reduce((s, d) => s + d.issued, 0);
const TOTAL_REDEEMED = MOCK_WEEKLY_POINTS.reduce((s, d) => s + d.redeemed, 0);

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <p style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'capitalize' }}>{p.name}</span>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '13px', marginLeft: 'auto', paddingLeft: '12px', fontVariantNumeric: 'tabular-nums' }}>
            {p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

interface PointsBarChartProps {
  period?: string;
}

export function PointsBarChart({ period = 'Week' }: PointsBarChartProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(59,130,246,0.05) 0%, #0d1424 40%, #0a0f1a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>Points Activity</h3>
          <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>Issued vs redeemed · {period}</p>
        </div>
        {/* Summary pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <p style={{ color: '#93c5fd', fontSize: '13px', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{TOTAL_ISSUED.toLocaleString()}</p>
            <p style={{ color: '#3b82f6', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>Issued</p>
          </div>
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '8px', padding: '6px 12px', textAlign: 'center' }}>
            <p style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{TOTAL_REDEEMED.toLocaleString()}</p>
            <p style={{ color: '#f87171', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>Redeemed</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={MOCK_WEEKLY_POINTS} barCategoryGap="28%" barGap={3}>
          <defs>
            <linearGradient id="issuedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="redeemedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fca5a5" stopOpacity={1} />
              <stop offset="100%" stopColor="#dc2626" stopOpacity={0.75} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} strokeDasharray="0" />
          <XAxis
            dataKey="day"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: '#334155', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)', radius: 6 }} />
          <Bar dataKey="issued" name="issued" fill="url(#issuedGrad)" radius={[5, 5, 2, 2]} />
          <Bar dataKey="redeemed" name="redeemed" fill="url(#redeemedGrad)" radius={[5, 5, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
