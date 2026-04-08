import { useAuthStore } from '../../store/authStore';
import { useMerchantSettings } from '../../hooks/useMerchant';
import { getEnvironment, isDemoMode } from '../../config/env';
import { Badge } from '../ui/badge';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export function TopBar() {
  const { logout, user } = useAuthStore();
  const { data: merchant, isLoading: merchantLoading } = useMerchantSettings();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const environment = getEnvironment();
  const demoMode = isDemoMode();
  const envBadgeVariant =
    environment === 'DEMO' ? 'warning' : environment === 'PILOT' ? 'secondary' : 'success';

  return (
    <header className="h-16 sm:h-20 border-b backdrop-blur-2xl sticky top-0 z-30 shadow-lg shadow-black/20" style={{ background: 'var(--topbar-bg)', borderColor: 'var(--border)' }}>
      <div className="h-full pl-16 lg:pl-8 pr-4 sm:pr-8 flex items-center justify-between">
        {/* Left: Merchant name */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-white truncate">
            {merchantLoading ? 'Loading...' : (merchant?.name || 'Merchant Dashboard')}
          </h2>
          {demoMode && (
            <Badge variant="warning" className="floating-chip text-xs font-semibold">
              DEMO MODE
            </Badge>
          )}
          <Badge variant={envBadgeVariant} className="floating-chip text-xs font-semibold">
            {environment}
          </Badge>
        </div>

        {/* Right: User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
          >
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              {merchant?.logoUrl ? (
                <img src={merchant.logoUrl} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <span className="text-sm font-semibold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
              {user?.email || 'User'}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="animate-reveal-up absolute right-0 mt-2 w-56 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/20 z-50 overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="p-2">
                  <div className="px-4 py-3 text-sm mb-1" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                    {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
