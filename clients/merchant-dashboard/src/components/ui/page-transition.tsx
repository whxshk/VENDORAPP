import { useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Trigger fade on route change
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      className={cn(
        'transition-all duration-[400ms] ease-out',
        isVisible 
          ? 'opacity-100 translate-y-0 blur-0' 
          : 'opacity-0 translate-y-2 blur-[1px]',
        className
      )}
    >
      {children}
    </div>
  );
}

// Fade only transition (no translate)
export function FadeTransition({ children, className }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'transition-opacity duration-500 ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// Staggered children animation
interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className, staggerDelay = 50 }: StaggeredListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-fade-in-up"
          style={{ 
            animationDelay: `${index * staggerDelay}ms`,
            animationFillMode: 'backwards'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Scale in animation wrapper
export function ScaleIn({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95',
        className
      )}
    >
      {children}
    </div>
  );
}
