import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setIsVisible(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-20 flex items-start justify-center p-4 pt-20 sm:pt-24 overflow-y-auto"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ease-out",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
      />
      <div 
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "transform transition-all duration-300 ease-out",
          isAnimating 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-4"
        )}
      >
        {children}
      </div>
    </div>
  );
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative z-50 w-full max-w-lg rounded-2xl border backdrop-blur-xl',
        'p-8 shadow-2xl shadow-black/50',
        'max-h-[85vh] overflow-y-auto',
        className
      )}
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-strong)',
        color: 'var(--text-primary)',
      }}
      {...props}
    >
      {children}
    </div>
  )
);
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 
      ref={ref} 
      className={cn(
        'text-2xl font-bold leading-tight tracking-tight',
        className
      )}
      style={{ color: 'var(--text-primary)' }}
      {...props} 
    />
  )
);
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
DialogDescription.displayName = 'DialogDescription';

const DialogClose = ({ onClose }: { onClose: () => void }) => (
  <button
    onClick={onClose}
    className={cn(
      "absolute right-4 top-4 rounded-full p-2",
      "bg-white/5 hover:bg-white/10 active:bg-white/15",
      "opacity-70 hover:opacity-100",
      "transition-all duration-200 ease-out",
      "hover:rotate-90 hover:scale-110 active:scale-95",
      "focus:outline-none focus:ring-2 focus:ring-white/20"
    )}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
);

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose };
