import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function cn(...args: Parameters<typeof clsx>) {
  return twMerge(clsx(...args));
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f1623] disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-gradient-to-r from-admin-500 to-admin-700 text-white hover:from-admin-600 hover:to-admin-800 shadow-lg shadow-admin-900/50 focus:ring-admin-500': variant === 'primary',
          'bg-white/10 text-slate-200 hover:bg-white/15 border border-white/10 focus:ring-white/20': variant === 'secondary',
          'border border-white/15 text-slate-300 hover:bg-white/5 hover:border-white/25 focus:ring-white/20': variant === 'outline',
          'text-slate-400 hover:text-slate-200 hover:bg-white/5 focus:ring-white/10': variant === 'ghost',
          'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:border-red-500/50 focus:ring-red-500/50': variant === 'danger',
          'h-8 px-3 text-xs': size === 'sm',
          'h-10 px-4 text-sm': size === 'md',
          'h-12 px-6 text-base': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>}
      <input
        className={cn(
          'w-full h-10 px-3 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-admin-500/50 focus:border-admin-500/40',
          'transition-all duration-200',
          error && 'border-red-500/50 focus:ring-red-500/50',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('rounded-2xl border', className)}
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'slate';

export function Badge({ variant = 'slate', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', {
        'bg-emerald-500/15 text-emerald-400': variant === 'green',
        'bg-red-500/15 text-red-400': variant === 'red',
        'bg-amber-500/15 text-amber-400': variant === 'amber',
        'bg-blue-500/15 text-blue-400': variant === 'blue',
        'bg-admin-500/15 text-admin-400': variant === 'purple',
        'bg-slate-500/15 text-slate-400': variant === 'slate',
      })}
    >
      {children}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Loader2
      className={cn('animate-spin text-admin-400', {
        'h-4 w-4': size === 'sm',
        'h-6 w-6': size === 'md',
        'h-8 w-8': size === 'lg',
      })}
    />
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl border p-6 animate-fade-in-up shadow-2xl"
        style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-strong)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

export function StatCard({
  title,
  value,
  sub,
  icon,
  color = 'purple',
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: 'purple' | 'blue' | 'green' | 'amber' | 'red';
}) {
  const colorMap = {
    purple: { bg: 'rgba(217,70,239,0.08)', border: 'rgba(217,70,239,0.2)', icon: '#d946ef', glow: 'rgba(217,70,239,0.15)' },
    blue:   { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)',  icon: '#60a5fa', glow: 'rgba(59,130,246,0.15)' },
    green:  { bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  icon: '#34d399', glow: 'rgba(52,211,153,0.15)' },
    amber:  { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  icon: '#fbbf24', glow: 'rgba(245,158,11,0.15)' },
    red:    { bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.2)',   icon: '#fb7185', glow: 'rgba(244,63,94,0.15)' },
  };
  const c = colorMap[color];

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: c.bg, border: `1px solid ${c.border}`, boxShadow: `0 4px 20px ${c.glow}` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${c.icon}22`, color: c.icon }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black text-slate-100 tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 text-slate-600 mb-4">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
    </div>
  );
}
