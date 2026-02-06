import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'text' | 'card';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-700/50',
        {
          'rounded-md': variant === 'default',
          'rounded-full': variant === 'circular',
          'rounded h-4': variant === 'text',
          'rounded-2xl': variant === 'card',
        },
        className
      )}
    />
  );
}

// Shimmer effect skeleton
export function SkeletonShimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-slate-700/30',
        className
      )}
    >
      <div 
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-slate-600/20 to-transparent animate-shimmer"
        style={{ animationDuration: '1.5s' }}
      />
    </div>
  );
}

// Card skeleton for loading states
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-4" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" variant="default" />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

// Full page loading skeleton
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      
      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/40 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
