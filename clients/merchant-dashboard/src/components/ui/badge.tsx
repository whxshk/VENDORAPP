import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  pulse?: boolean;
}

function Badge({ className, variant = 'default', pulse = false, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold',
        'transition-all duration-300 ease-out',
        'hover:scale-105 active:scale-95',
        {
          'border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40': variant === 'default',
          'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50': variant === 'secondary',
          'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50': variant === 'destructive',
          'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30': variant === 'outline',
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50': variant === 'success',
          'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50': variant === 'warning',
        },
        pulse && 'animate-pulse-soft',
        className
      )}
      {...props}
    />
  );
}

export { Badge };
