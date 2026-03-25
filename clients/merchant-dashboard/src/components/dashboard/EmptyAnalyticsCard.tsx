import { ReactNode } from 'react';

interface EmptyAnalyticsCardProps {
  title: string;
  message: string;
  hint?: string;
  icon?: ReactNode;
  minHeight?: number;
}

export function EmptyAnalyticsCard({ title, message, hint, icon, minHeight = 220 }: EmptyAnalyticsCardProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #0d1424 0%, #0a0f1a 100%)',
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight,
        gap: '12px',
      }}
    >
      {icon && (
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#334155',
            marginBottom: '4px',
          }}
        >
          {icon}
        </div>
      )}
      <p style={{ color: '#475569', fontSize: '13px', fontWeight: 700, margin: 0 }}>{title}</p>
      <p style={{ color: '#334155', fontSize: '12px', lineHeight: 1.5, margin: 0, maxWidth: '260px' }}>{message}</p>
      {hint && (
        <p
          style={{
            color: '#1e293b',
            fontSize: '11px',
            margin: 0,
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
