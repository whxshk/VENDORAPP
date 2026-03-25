/**
 * Activity by Hour — bar chart.
 * DATA: 100% real. Derived from actual transaction timestamps by DashboardHome.
 * No mock data. Receives pre-computed hourly buckets.
 */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EmptyAnalyticsCard } from '../EmptyAnalyticsCard';
import { Clock } from 'lucide-react';

interface HourBucket {
  hour: string;
  count: number;
  sortKey: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.97)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <p style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ color: '#fff', fontWeight: 900, fontSize: '16px', margin: 0 }}>
        {payload[0].value}
        <span style={{ color: '#475569', fontSize: '11px', fontWeight: 400, marginLeft: '4px' }}>
          transaction{payload[0].value !== 1 ? 's' : ''}
        </span>
      </p>
    </div>
  );
}

interface ActivityByHourChartProps {
  data: HourBucket[];
  totalTransactions: number;
}

export function ActivityByHourChart({ data, totalTransactions }: ActivityByHourChartProps) {
  if (data.length === 0) {
    return (
      <EmptyAnalyticsCard
        title="No Activity Data"
        message="Hour-by-hour activity will appear once transactions are recorded."
        icon={<Clock size={20} />}
        minHeight={260}
      />
    );
  }

  const peakBucket = data.reduce((max, d) => (d.count > max.count ? d : max), data[0]);

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(99,102,241,0.05) 0%, #0d1424 40%, #0a0f1a 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>Activity by Hour</h3>
          <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
            From actual transaction timestamps · {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div
            style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.22)',
              borderRadius: '8px',
              padding: '5px 10px',
            }}
          >
            <p style={{ color: '#a5b4fc', fontSize: '11px', fontWeight: 800, margin: 0 }}>
              Peak: {peakBucket.hour}
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%">
          <defs>
            <linearGradient id="activityBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="activityBarGradPeak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4b5fd" stopOpacity={1} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)', radius: 6 }} />
          <Bar dataKey="count" radius={[6, 6, 2, 2]}>
            {data.map((d) => (
              <Cell
                key={d.hour}
                fill={d.hour === peakBucket.hour ? 'url(#activityBarGradPeak)' : 'url(#activityBarGrad)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Footer note */}
      <p style={{ color: '#1e293b', fontSize: '10px', textAlign: 'right', marginTop: '4px' }}>
        Showing hours with recorded activity only
      </p>
    </div>
  );
}
