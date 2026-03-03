import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-white/10 bg-slate-800/50 px-4 py-2 text-sm',
          'backdrop-blur-sm text-white placeholder:text-slate-400',
          'ring-offset-2 ring-offset-slate-900',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 focus-visible:shadow-lg focus-visible:shadow-blue-500/20',
          'hover:border-white/20 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 ease-out focus:scale-[1.01]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-800/30',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
