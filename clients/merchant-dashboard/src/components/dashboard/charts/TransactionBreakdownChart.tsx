/**
 * Transaction type breakdown — donut chart.
 * DATA: 100% real. Derived from actual recentActivity transactions by DashboardHome.
 * No mock data. Props come from computed counts.
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { EmptyAnalyticsCard } from '../EmptyAnalyticsCard';
import { ArrowUpRight, ArrowDownRight, Stamp } from 'lucide-react';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.97)',
        border: `1px solid ${item.payload.color}40`,
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.payload.color }} />
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{item.name}</span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px', marginLeft: '4px' }}>{item.value}</span>
      </div>
    </div>
  );
}

interface TransactionBreakdownChartProps {
  earnCount: number;
  redeemCount: number;
  stampCount: number;
}

export function TransactionBreakdownChart({ earnCount, redeemCount, stampCount }: TransactionBreakdownChartProps) {
  const total = earnCount + redeemCount + stampCount;

  if (total === 0) {
    return (
      <EmptyAnalyticsCard
        title="No Transactions"
        message="Transaction breakdown will appear once activity is recorded."
      />
    );
  }

  const segments = [
    { name: 'Earn', value: earnCount, color: '#34d399', icon: ArrowUpRight },
    { name: 'Redeem', value: redeemCount, color: '#f87171', icon: ArrowDownRight },
    { name: 'Stamp', value: stampCount, color: '#fbbf24', icon: Stamp },
  ].filter(s => s.value > 0);

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(52,211,153,0.04) 0%, #0d1424 45%, #0a0f1a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        height: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>Transaction Breakdown</h3>
        <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>By type · recent activity</p>
      </div>

      {/* Donut chart */}
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={78}
              dataKey="value"
              strokeWidth={0}
              paddingAngle={segments.length > 1 ? 4 : 0}
              startAngle={90}
              endAngle={-270}
            >
              {segments.map((s, i) => (
                <Cell key={i} fill={s.color} opacity={i === 0 ? 1 : 0.8} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {total}
            </p>
            <p style={{ color: '#475569', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
              total
            </p>
          </div>
        </div>
      </div>

      {/* Legend rows */}
      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segments.map((s) => {
          const pct = Math.round((s.value / total) * 100);
          const Icon = s.icon;
          return (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '7px',
                  background: `${s.color}18`,
                  border: `1px solid ${s.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: s.color,
                }}
              >
                <Icon size={13} />
              </div>
              <span style={{ color: '#94a3b8', fontSize: '12px', flex: 1 }}>{s.name}</span>
              <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                {s.value}
              </span>
              <span
                style={{
                  background: `${s.color}18`,
                  color: s.color,
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '6px',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: '34px',
                  textAlign: 'center',
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
