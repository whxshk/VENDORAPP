/**
 * Peak Hours chart — transaction density for the current 8-hour window.
 *
 * Three rotating windows (based on current time):
 *   8 am – 4 pm   (active 08:00–15:59)
 *   4 pm – 2 am   (active 16:00–01:59)
 *   2 am – 8 am   (active 02:00–07:59)
 *
 * Receives a 24-element array (one entry per hour, 0-23) from DashboardHome.
 * Slices to the current window, fills zeros for hours with no transactions,
 * and renders a smooth spline area chart with vertical grid lines.
 */
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HourBucket {
  hour: number;   // 0–23
  label: string;  // '9am', '3pm', etc.
  count: number;
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
        background: 'var(--bg-surface)',
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

/** Returns the ordered hour-numbers for the current time window */
function getCurrentWindow(): number[] {
  const h = new Date().getHours();
  if (h >= 8 && h < 16) return [8, 9, 10, 11, 12, 13, 14, 15];
  if (h >= 16 || h < 2)  return [16, 17, 18, 19, 20, 21, 22, 23, 0, 1];
  return [2, 3, 4, 5, 6, 7];
}

interface PeakHoursChartProps {
  data: HourBucket[]; // 24 elements, index = hour
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
  const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '16px',
    padding: '24px',
    height: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
  };

  const windowHours = getCurrentWindow();

  // Build the window data, ensuring zeros for hours with no activity
  const windowData = windowHours.map(h => {
    const bucket = data.find(d => d.hour === h);
    const label = `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
    return { label, count: bucket?.count ?? 0 };
  });

  const totalInWindow = windowData.reduce((s, d) => s + d.count, 0);
  const peakBucket = windowData.reduce((max, d) => (d.count > max.count ? d : max), windowData[0]);

  // Y-axis: always start at 0; max is at least 4 so ticks look reasonable
  const maxCount = Math.max(...windowData.map(d => d.count), 4);
  const yMax = Math.ceil(maxCount / 2) * 2; // round up to nearest even

  if (totalInWindow === 0) {
    return (
      <div style={{ ...cardStyle, minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#334155', fontSize: '13px' }}>No activity in this window yet</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, margin: 0 }}>Peak Hours</h3>
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
            Peak: {peakBucket.label}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={windowData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="peakAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9333ea" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#9333ea" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="rgba(100,116,139,0.15)"
            vertical={true}
            horizontal={true}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            domain={[0, yMax]}
            tickCount={yMax + 1}
            allowDecimals={false}
            tickFormatter={(v: number) => (Number.isInteger(v) ? String(v) : '')}
            tick={{ fill: '#334155', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(168,85,247,0.3)', strokeWidth: 1 }} />
          <Area
            type="natural"
            dataKey="count"
            stroke="#a855f7"
            strokeWidth={2.5}
            fill="url(#peakAreaGrad)"
            dot={{ fill: '#a855f7', strokeWidth: 0, r: 4 }}
            activeDot={{ fill: '#d8b4fe', stroke: '#a855f7', strokeWidth: 2, r: 6 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
