/**
 * Customer Breakdown — donut chart.
 *
 * REAL DATA: Props are derived from live API data (todaysCustomers, repeatCustomers).
 * No mock data needed — values are passed in from DashboardHome.
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string; glow: string } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.95)',
        border: `1px solid ${item.payload.color}40`,
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 16px ${item.payload.glow}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.payload.color, flexShrink: 0 }} />
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{item.name}</span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px', marginLeft: '4px' }}>{item.value}</span>
      </div>
    </div>
  );
}

interface CustomerDonutChartProps {
  returning: number;
  newCustomers: number;
}

export function CustomerDonutChart({ returning, newCustomers }: CustomerDonutChartProps) {
  const total = returning + newCustomers;
  const returningPct = total > 0 ? Math.round((returning / total) * 100) : 0;
  const data = [
    { name: 'Returning', value: returning || 0, color: '#818cf8', glow: 'rgba(99,102,241,0.3)' },
    { name: 'New', value: newCustomers || 0, color: '#38bdf8', glow: 'rgba(56,189,248,0.3)' },
  ];

  const isEmpty = total === 0;

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(99,102,241,0.07) 0%, #0d1424 45%, #0a0f1a 100%)',
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
        <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>Customer Mix</h3>
        <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>Returning vs new · Today</p>
      </div>

      {isEmpty ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#334155', fontSize: '13px' }}>No customers today</p>
        </div>
      ) : (
        <>
          {/* Donut chart with large center label */}
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <defs>
                  <filter id="donutGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={90}
                  dataKey="value"
                  strokeWidth={0}
                  paddingAngle={4}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      opacity={i === 0 ? 1 : 0.75}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center overlay — prominent total */}
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
                <p
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: '#f8fafc',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: '0 0 30px rgba(99,102,241,0.4)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {total}
                </p>
                <p style={{ color: '#475569', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
                  Today
                </p>
              </div>
            </div>
          </div>

          {/* Legend rows */}
          <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.map((d) => {
              const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <div key={d.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0, boxShadow: `0 0 6px ${d.color}` }} />
                      <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>{d.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
                      <span
                        style={{
                          background: `${d.color}20`,
                          color: d.color,
                          border: `1px solid ${d.color}30`,
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '6px',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: '2px',
                        background: `linear-gradient(90deg, ${d.color}80, ${d.color})`,
                        boxShadow: `0 0 6px ${d.color}60`,
                        transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Return rate callout */}
          {returning > 0 && (
            <div
              style={{
                marginTop: '14px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: '10px',
                padding: '10px 14px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                <span style={{ color: '#a5b4fc', fontWeight: 900, fontSize: '20px', display: 'block', lineHeight: 1.1 }}>
                  {returningPct}%
                </span>
                loyalty return rate
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
