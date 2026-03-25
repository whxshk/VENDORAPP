/**
 * Peak Hours area chart.
 * DATA: 100% real. Uses hourlyData computed from real transaction timestamps.
 */
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <p style={{ color: '#64748b', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ color: '#c084fc', fontWeight: 900, fontSize: '16px', margin: 0 }}>
        {payload[0].value}
        <span style={{ color: '#475569', fontSize: '11px', fontWeight: 400, marginLeft: '4px' }}>
          transaction{payload[0].value !== 1 ? 's' : ''}
        </span>
      </p>
    </div>
  );
}

interface PeakHoursChartProps {
  data: HourBucket[];
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
  const cardStyle = {
    background: 'linear-gradient(160deg, rgba(168,85,247,0.05) 0%, #0d1424 40%, #0a0f1a 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    height: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
  };

  if (data.length === 0) {
    return (
      <div style={{ ...cardStyle, minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#334155', fontSize: '13px' }}>No activity data yet</p>
      </div>
    );
  }

  const peakBucket = data.reduce((max, d) => (d.count > max.count ? d : max), data[0]);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, margin: 0 }}>Peak Hours</h3>
          <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>Transaction density by time</p>
        </div>
        <div
          style={{
            background: 'rgba(168,85,247,0.12)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: '8px',
            padding: '5px 10px',
            flexShrink: 0,
          }}
        >
          <p style={{ color: '#c084fc', fontSize: '11px', fontWeight: 800, margin: 0 }}>
            Peak: {peakBucket.hour}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="peakAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9333ea" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#9333ea" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
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
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(168,85,247,0.3)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#a855f7"
            strokeWidth={2.5}
            fill="url(#peakAreaGrad)"
            dot={{ fill: '#a855f7', strokeWidth: 0, r: 4 }}
            activeDot={{ fill: '#d8b4fe', stroke: '#a855f7', strokeWidth: 2, r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
