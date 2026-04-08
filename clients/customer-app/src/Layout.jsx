import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Wallet, Compass, QrCode, Clock, User } from "lucide-react";
import { AuthRouter } from "@/components/auth/AuthRouter";

const navItems = [
  { page: "Wallet", icon: Wallet, label: "Wallet" },
  { page: "Discover", icon: Compass, label: "Discover" },
  { page: "Home", icon: QrCode, label: "Scan", center: true },
  { page: "Activity", icon: Clock, label: "Activity" },
  { page: "Profile", icon: User, label: "Profile" },
];

export default function Layout({ children, currentPageName }) {
  const hideNav = currentPageName === "MerchantDetail" || 
    ["Splash", "PhoneInput", "OTPVerification", "Welcome"].includes(currentPageName);

  return (
    <AuthRouter currentPageName={currentPageName}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <style>{`
        :root {
          --color-primary: #0A1931;
          --color-accent: #F97316;
          --bg-primary: #FFFFFF;
          --bg-secondary: #F9FAFB;
          --text-primary: #0A1931;
          --text-secondary: #6B7280;
          --border-color: #E5E7EB;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        button, a, [role="button"] {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Page Content */}
      <div className="flex-1 max-w-lg mx-auto w-full relative">
        {children}
      </div>

      {/* Bottom Navigation */}
      {!hideNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-lg mx-auto">
            <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 px-2 pb-safe">
              <div className="flex items-end justify-around h-16">
                {navItems.map(item => {
                  const isActive = currentPageName === item.page;
                  
                  if (item.center) {
                    return (
                      <Link key={item.page} to={createPageUrl(item.page)} className="flex flex-col items-center -mt-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                          isActive
                            ? "bg-orange-500 shadow-orange-500/30 scale-105"
                            : "bg-[#0A1931] shadow-[#0A1931]/30"
                        }`}>
                          <item.icon className="w-6 h-6 text-white" strokeWidth={2} />
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      className="flex flex-col items-center py-2 px-3"
                    >
                      <item.icon
                        className={`w-5 h-5 transition-colors duration-200 ${
                          isActive ? "text-[#0A1931] dark:text-white" : "text-gray-400 dark:text-gray-500"
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      <span className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                        isActive ? "text-[#0A1931] dark:text-white" : "text-gray-400 dark:text-gray-500"
                      }`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="w-1 h-1 rounded-full bg-[#0A1931] dark:bg-white mt-1" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthRouter>
  );
}
