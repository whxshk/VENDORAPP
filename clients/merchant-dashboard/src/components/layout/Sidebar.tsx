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
import { useState } from 'react';
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

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64',
          'bg-slate-900/90 backdrop-blur-2xl',
          'border-r border-white/5',
          'shadow-[4px_0_24px_rgba(0,0,0,0.5)]',
          'transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <h1
              className="text-2xl font-bold tracking-tight"
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

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg shadow-blue-500/10 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive ? 'text-blue-400' : '')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile overlay */}
        {isMobileOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </aside>
    </>
  );
}
