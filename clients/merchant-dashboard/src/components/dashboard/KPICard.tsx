import { Card, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ title, value, description, trend, icon, className }: KPICardProps) {
  return (
    <Card className={cn('group hover:scale-[1.02] transition-all duration-300 border-white/5', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</p>
            <div className="flex items-baseline gap-3 mb-2">
              <p className="text-3xl font-bold text-white">
                {value}
              </p>
              {trend && (
                <div className={cn(
                  'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md',
                  trend.isPositive 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : 'text-red-400 bg-red-500/10'
                )}>
                  {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
          </div>
          {icon && (
            <div className="ml-4 p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
