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
    <header className="h-20 border-b border-white/5 bg-slate-900/60 backdrop-blur-2xl sticky top-0 z-30 shadow-lg shadow-black/30">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Left: Merchant name */}
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">
            {merchantLoading ? 'Loading...' : (merchant?.name || 'Merchant Dashboard')}
          </h2>
          {demoMode && (
            <Badge variant="warning" className="text-xs font-semibold">
              DEMO MODE
            </Badge>
          )}
          <Badge variant={envBadgeVariant} className="text-xs font-semibold">
            {environment}
          </Badge>
        </div>

        {/* Right: User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white hidden sm:block">
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
              <div className="absolute right-0 mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                <div className="p-2">
                  <div className="px-4 py-3 text-sm text-slate-300 border-b border-white/10 mb-1">
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
