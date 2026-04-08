import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Store, Users, FileText, LogOut, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../ui';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Overview' },
  { to: '/merchants', icon: Store,           label: 'Merchants' },
  { to: '/customers', icon: Users,           label: 'Customers' },
  { to: '/logs',      icon: FileText,        label: 'System Logs' },
];

export function Sidebar() {
  const { logout, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const inner = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br from-admin-500 to-admin-700 shadow-lg shadow-admin-900/50">
            🦈
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">SharkBand</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck className="h-3 w-3 text-admin-400" />
              <p className="text-[10px] font-semibold text-admin-400 uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-admin-500/15 text-admin-300 shadow-inner'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4 w-4', isActive ? 'text-admin-400' : '')} />
                {label}
                {isActive && <div className="ml-auto w-1 h-4 rounded-full bg-admin-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-admin-500 to-admin-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user?.email || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{user?.email || 'Admin'}</p>
            <p className="text-[10px] text-slate-600">{user?.roles?.[0] || 'PLATFORM_ADMIN'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 flex-shrink-0 sticky top-0 h-screen border-r"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {inner}
      </aside>

      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl flex items-center justify-center bg-admin-500/20 text-admin-400 border border-admin-500/30"
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside
            className="fixed inset-y-0 left-0 z-50 w-56 flex flex-col border-r lg:hidden"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            {inner}
          </aside>
        </>
      )}
    </>
  );
}
