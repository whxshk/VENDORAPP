import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold',
          'soft-glow relative overflow-hidden transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
          'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] hover:-translate-y-[1px] active:scale-[0.98]': variant === 'default',
            'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-[1px]': variant === 'secondary',
            'border border-white/20 bg-transparent hover:bg-white/5 hover:border-white/30 text-white hover:-translate-y-[1px]': variant === 'outline',
            'hover:bg-white/5 text-white hover:-translate-y-[1px]': variant === 'ghost',
            'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 hover:-translate-y-[1px]': variant === 'destructive',
            'h-11 px-6 text-sm': size === 'default',
            'h-9 px-4 text-xs': size === 'sm',
            'h-12 px-8 text-base': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
