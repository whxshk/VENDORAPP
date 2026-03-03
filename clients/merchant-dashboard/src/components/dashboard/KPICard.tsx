import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn, toNumber } from '../../lib/utils';

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
  index?: number;
}

// Animated counter hook
function useCountAnimation(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const startTime = Date.now();
    const startValue = countRef.current;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + (end - startValue) * easeOutQuart);
      
      setCount(current);
      countRef.current = current;
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);

  return count;
}

export function KPICard({ title, value, description, trend, icon, className, index = 0 }: KPICardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Convert value to number for animation
  const numericValue = typeof value === 'object' && value !== null 
    ? toNumber(value) 
    : typeof value === 'number' 
      ? value 
      : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
  
  const animatedValue = useCountAnimation(isVisible ? numericValue : 0, 1200);
  
  // Format the display value
  const displayValue = typeof value === 'string' && value.includes('%')
    ? `${animatedValue}%`
    : typeof value === 'string' && value.includes('$')
      ? `$${animatedValue.toLocaleString()}`
      : animatedValue.toLocaleString();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        "opacity-0 translate-y-4",
        isVisible && "animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      <Card className={cn(
        'group overflow-hidden',
        'hover:scale-[1.02] hover:-translate-y-1',
        'transition-all duration-300 ease-out',
        'border-white/5 hover:border-white/10',
        'hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]',
        className
      )}>
        <CardContent className="p-6 relative">
          {/* Animated gradient background */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
          </div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {title}
              </p>
              <div className="flex items-baseline gap-3 mb-2">
                <p className={cn(
                  "text-3xl font-bold text-white transition-all duration-300",
                  "group-hover:text-blue-100"
                )}>
                  {typeof value === 'number' || (typeof value === 'string' && /^[\d$%.,]+$/.test(value))
                    ? displayValue
                    : (typeof value === 'object' && value !== null ? toNumber(value) : value)
                  }
                </p>
                {trend && (
                  <div className={cn(
                    'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md',
                    'transform transition-all duration-300',
                    'group-hover:scale-105',
                    trend.isPositive 
                      ? 'text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20' 
                      : 'text-red-400 bg-red-500/10 group-hover:bg-red-500/20'
                  )}>
                    {trend.isPositive 
                      ? <TrendingUp className="h-3.5 w-3.5 animate-bounce-soft" /> 
                      : <TrendingDown className="h-3.5 w-3.5" />
                    }
                    <span>{Math.abs(trend.value)}%</span>
                  </div>
                )}
              </div>
              {description && (
                <p className="text-xs text-slate-400 mt-1 transition-colors duration-300 group-hover:text-slate-300">
                  {description}
                </p>
              )}
            </div>
            {icon && (
              <div className={cn(
                "ml-4 p-3 rounded-xl",
                "bg-gradient-to-br from-blue-500/20 to-purple-500/20",
                "text-blue-400",
                "transition-all duration-300 ease-out",
                "group-hover:scale-110 group-hover:rotate-3",
                "group-hover:shadow-lg group-hover:shadow-blue-500/20"
              )}>
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
