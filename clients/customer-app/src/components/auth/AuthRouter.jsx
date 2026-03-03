import React from "react";
import { useAuth } from "./AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const publicRoutes = ["Splash", "PhoneInput", "OTPVerification", "Welcome", "Register"];

export function AuthRouter({ children, currentPageName }) {
  const { user, loading, hasCompletedOnboarding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(currentPageName);

    // Not authenticated
    if (!user) {
      // First time user - start with splash
      if (!sessionStorage.getItem("hasSeenSplash")) {
        sessionStorage.setItem("hasSeenSplash", "true");
        if (currentPageName !== "Splash" && !isPublicRoute) {
          navigate(createPageUrl("Splash"), { replace: true });
        }
      } else {
        // Returning user who logged out - skip splash
        if (!isPublicRoute) {
          navigate(createPageUrl("PhoneInput"), { replace: true });
        }
      }
      return;
    }

    // Authenticated but hasn't completed onboarding
    if (user && !hasCompletedOnboarding) {
      if (currentPageName !== "Welcome") {
        navigate(createPageUrl("Welcome"), { replace: true });
      }
      return;
    }

    // Authenticated and onboarded - redirect away from auth screens
    if (user && hasCompletedOnboarding && isPublicRoute) {
      navigate(createPageUrl("Home"), { replace: true });
    }
  }, [user, loading, hasCompletedOnboarding, currentPageName, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1931] to-[#0f2440] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🦈</span>
          </div>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    );
  }

  return children;
}