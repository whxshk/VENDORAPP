import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  Users,
  Receipt,
  Gift,
  UserCog,
  Settings,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Scan', href: '/dashboard/scan', icon: ScanLine },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Transactions', href: '/dashboard/transactions', icon: Receipt },
  { name: 'Rewards', href: '/dashboard/rewards', icon: Gift },
  { name: 'Staff', href: '/dashboard/staff', icon: UserCog },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Pilot Report', href: '/dashboard/pilot-report', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className={cn(
          "lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl",
          "bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-lg",
          "transition-all duration-300 ease-out",
          "hover:bg-slate-800/90 hover:border-white/20 hover:scale-105",
          "active:scale-95"
        )}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <div className="relative w-5 h-5">
          <Menu className={cn(
            "absolute inset-0 h-5 w-5 text-white transition-all duration-300",
            isMobileOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
          )} />
          <X className={cn(
            "absolute inset-0 h-5 w-5 text-white transition-all duration-300",
            isMobileOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          )} />
        </div>
      </button>

      {/* Mobile overlay with fade animation */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30",
          "transition-opacity duration-300 ease-out",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64',
          'backdrop-blur-2xl',
          'border-r',
          'shadow-[4px_0_24px_rgba(0,0,0,0.3)]',
          'transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
      >
        <div className="h-full flex flex-col">
          {/* Logo with subtle animation */}
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <h1
              className={cn(
                "text-2xl font-bold tracking-tight transition-all duration-500",
                mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              )}
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              SharkBand
            </h1>
          </div>

          {/* Navigation with staggered animations */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
                    'transition-all duration-300 ease-out',
                    'overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg shadow-blue-500/10 border border-blue-500/30'
                      : 'hover:bg-white/5 border border-transparent hover:border-white/10'
                  )}
                  style={{
                    animationDelay: mounted ? `${index * 50}ms` : '0ms',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `all 0.3s ease-out ${index * 50}ms`,
                    color: isActive ? undefined : 'var(--text-secondary)',
                  }}
                >
                  {/* Hover glow effect */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    "pointer-events-none"
                  )} />
                  
                  {/* Active indicator bar */}
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full",
                    "bg-gradient-to-b from-blue-400 to-purple-500",
                    "transition-all duration-300 ease-out",
                    isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
                  )} />
                  
                  <Icon className={cn(
                    'h-5 w-5 transition-all duration-300',
                    'group-hover:scale-110',
                    isActive ? 'text-blue-400' : 'group-hover:text-blue-300'
                  )} />
                  <span className="relative z-10">{item.name}</span>
                  
                  {/* Subtle arrow indicator on hover */}
                  <div className={cn(
                    "absolute right-3 opacity-0 group-hover:opacity-100 transition-all duration-300",
                    "transform translate-x-2 group-hover:translate-x-0",
                    isActive && "opacity-100 translate-x-0"
                  )}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {/* Bottom gradient fade */}
          <div className="h-8 bg-gradient-to-t from-[var(--sidebar-bg)] to-transparent pointer-events-none" />
        </div>
      </aside>
    </>
  );
}
