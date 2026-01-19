import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200',
        {
          'border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md shadow-blue-500/30': variant === 'default',
          'border-blue-500/30 bg-blue-500/10 text-blue-400': variant === 'secondary',
          'border-red-500/30 bg-red-500/10 text-red-400': variant === 'destructive',
          'border-white/20 bg-white/5 text-white': variant === 'outline',
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-400': variant === 'success',
          'border-amber-500/30 bg-amber-500/10 text-amber-400': variant === 'warning',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
