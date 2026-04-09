/**
 * Earn vs Redeem grouped bar chart.
 * DATA: 100% real. Groups earn and redeem transactions by hour from recentActivity.
 */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface EarnVsRedeemBucket {
  hour: string;
  earn: number;
  redeem: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <p style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 800, fontSize: '13px', margin: '2px 0' }}>
          {p.value}{' '}
          <span style={{ color: '#475569', fontWeight: 400 }}>
            {p.name === 'earn' ? 'issued' : 'redeemed'}
          </span>
        </p>
      ))}
    </div>
  );
}

interface EarnVsRedeemChartProps {
  data: EarnVsRedeemBucket[];
  totalTransactions: number;
}

export function EarnVsRedeemChart({ data, totalTransactions }: EarnVsRedeemChartProps) {
  const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '16px',
    padding: '24px',
    height: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
  };

  if (data.length === 0) {
    return (
      <div style={{ ...cardStyle, minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#334155', fontSize: '13px' }}>No transaction data yet</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, margin: 0 }}>Points Issued vs Redeemed</h3>
        <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
          Today · {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} barCategoryGap="35%" barGap={3}>
          <defs>
            <linearGradient id="earnBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
            </linearGradient>
            <linearGradient id="redeemBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
              <stop offset="100%" stopColor="#dc2626" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fill: '#334155', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={24}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-subtle)', radius: 4 }} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
                {value === 'earn' ? 'Issued' : 'Redeemed'}
              </span>
            )}
            wrapperStyle={{ paddingTop: '12px' }}
          />
          <Bar dataKey="earn" name="earn" fill="url(#earnBarGrad)" radius={[4, 4, 2, 2]} />
          <Bar dataKey="redeem" name="redeem" fill="url(#redeemBarGrad)" radius={[4, 4, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
