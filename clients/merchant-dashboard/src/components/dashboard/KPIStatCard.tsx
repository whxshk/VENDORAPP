import { ReactNode, useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const THEMES = {
  blue: {
    bgFrom: 'rgba(59,130,246,0.05)',
    border: 'rgba(59,130,246,0.15)',
    outerGlow: '0 0 16px rgba(59,130,246,0.04)',
    ambientColor: 'rgba(59,130,246,0.08)',
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#93c5fd',
    iconGlow: 'none',
    accentLine: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.2), transparent)',
    trendBg: 'rgba(59,130,246,0.1)',
    trendColor: '#60a5fa',
    trendBorder: 'rgba(59,130,246,0.18)',
    valueColor: '#eff6ff',
  },
  indigo: {
    bgFrom: 'rgba(99,102,241,0.05)',
    border: 'rgba(99,102,241,0.15)',
    outerGlow: '0 0 16px rgba(99,102,241,0.04)',
    ambientColor: 'rgba(99,102,241,0.08)',
    iconBg: 'rgba(99,102,241,0.12)',
    iconColor: '#a5b4fc',
    iconGlow: 'none',
    accentLine: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)',
    trendBg: 'rgba(99,102,241,0.1)',
    trendColor: '#818cf8',
    trendBorder: 'rgba(99,102,241,0.18)',
    valueColor: '#eef2ff',
  },
  purple: {
    bgFrom: 'rgba(168,85,247,0.05)',
    border: 'rgba(168,85,247,0.15)',
    outerGlow: '0 0 16px rgba(168,85,247,0.04)',
    ambientColor: 'rgba(168,85,247,0.08)',
    iconBg: 'rgba(168,85,247,0.12)',
    iconColor: '#d8b4fe',
    iconGlow: 'none',
    accentLine: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.2), transparent)',
    trendBg: 'rgba(168,85,247,0.1)',
    trendColor: '#c084fc',
    trendBorder: 'rgba(168,85,247,0.18)',
    valueColor: '#faf5ff',
  },
  emerald: {
    bgFrom: 'rgba(52,211,153,0.04)',
    border: 'rgba(52,211,153,0.13)',
    outerGlow: '0 0 16px rgba(52,211,153,0.03)',
    ambientColor: 'rgba(52,211,153,0.07)',
    iconBg: 'rgba(52,211,153,0.1)',
    iconColor: '#6ee7b7',
    iconGlow: 'none',
    accentLine: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.18), transparent)',
    trendBg: 'rgba(52,211,153,0.08)',
    trendColor: '#34d399',
    trendBorder: 'rgba(52,211,153,0.14)',
    valueColor: '#ecfdf5',
  },
  rose: {
    bgFrom: 'rgba(244,63,94,0.05)',
    border: 'rgba(244,63,94,0.15)',
    outerGlow: '0 0 16px rgba(244,63,94,0.04)',
    ambientColor: 'rgba(244,63,94,0.08)',
    iconBg: 'rgba(244,63,94,0.12)',
    iconColor: '#fda4af',
    iconGlow: 'none',
    accentLine: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.2), transparent)',
    trendBg: 'rgba(244,63,94,0.1)',
    trendColor: '#fb7185',
    trendBorder: 'rgba(244,63,94,0.18)',
    valueColor: '#fff1f2',
  },
  amber: {
    bgFrom: 'rgba(245,158,11,0.05)',
    border: 'rgba(245,158,11,0.15)',
    outerGlow: '0 0 16px rgba(245,158,11,0.04)',
    ambientColor: 'rgba(245,158,11,0.08)',
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#fcd34d',
    iconGlow: 'none',
    accentLine: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)',
    trendBg: 'rgba(245,158,11,0.1)',
    trendColor: '#f59e0b',
    trendBorder: 'rgba(245,158,11,0.18)',
    valueColor: '#fffbeb',
  },
  slate: {
    bgFrom: 'rgba(100,116,139,0.05)',
    border: 'rgba(100,116,139,0.15)',
    outerGlow: '0 0 16px rgba(100,116,139,0.03)',
    ambientColor: 'rgba(100,116,139,0.08)',
    iconBg: 'rgba(100,116,139,0.12)',
    iconColor: '#94a3b8',
    iconGlow: 'none',
    accentLine: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.2), transparent)',
    trendBg: 'rgba(100,116,139,0.08)',
    trendColor: '#94a3b8',
    trendBorder: 'rgba(100,116,139,0.15)',
    valueColor: '#f8fafc',
  },
} as const;

function useCountUp(target: number, duration = 1100, active = true) {
  const [count, setCount] = useState(0);
  const frame = useRef<number>();
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.round(target * eased));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [target, duration, active]);
  return count;
}

interface KPIStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  theme: keyof typeof THEMES;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  suffix?: string;
  index?: number;
}

export function KPIStatCard({ title, value, description, icon, theme, trend, suffix, index = 0 }: KPIStatCardProps) {
  const t = THEMES[theme];
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  const isStringValue = typeof value === 'string' && isNaN(Number(value.replace(/[^0-9.]/g, '')));
  const animated = useCountUp(numericValue, 1100, visible);
  const hasSuffix = typeof value === 'string' && value.includes('%');
  const displayValue = isStringValue ? value : `${animated.toLocaleString()}${hasSuffix ? '%' : (suffix || '')}`;

  return (
    <div
      ref={ref}
      className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]"
      style={{
        background: `linear-gradient(150deg, ${t.bgFrom} 0%, #0d1424 55%, #0a0f1a 100%)`,
        border: `1px solid ${t.border}`,
        boxShadow: `${t.outerGlow}, 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
        padding: '20px 20px 18px',
      }}
    >
      {/* Top-left ambient light */}
      <div
        className="absolute -top-12 -left-12 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${t.ambientColor} 0%, transparent 60%)` }}
      />
      {/* Bottom accent glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: t.accentLine }}
      />

      <div className="relative z-10">
        {/* Top row: icon + trend */}
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: t.iconBg, color: t.iconColor, boxShadow: t.iconGlow }}
          >
            {icon}
          </div>
          {trend && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide"
              style={{
                background: t.trendBg,
                color: t.trendColor,
                border: `1px solid ${t.trendBorder}`,
              }}
            >
              {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend.direction === 'flat' && <Minus className="h-3 w-3" />}
              {trend.label}
            </span>
          )}
        </div>

        {/* Value — large, impactful */}
        <p
          className="font-black tabular-nums leading-none tracking-tight mb-2"
          style={{ fontSize: '2.75rem', color: t.valueColor, textShadow: `0 0 40px ${t.ambientColor}` }}
        >
          {displayValue}
        </p>

        {/* Title */}
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>

        {/* Description */}
        {description && (
          <p className="text-[11px] text-slate-600 leading-snug">{description}</p>
        )}
      </div>
    </div>
  );
}
