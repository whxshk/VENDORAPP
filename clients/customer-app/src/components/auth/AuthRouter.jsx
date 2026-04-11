import React from "react";
import { useAuth } from "./AuthProvider";
import { Navigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const publicRoutes = ["Splash", "PhoneInput", "OTPVerification", "Welcome", "Register", "ForgotPassword", "ResetPassword"];

export function AuthRouter({ children, currentPageName }) {
  const { user, loading, hasCompletedOnboarding } = useAuth();

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

  const isPublicRoute = publicRoutes.includes(currentPageName);

  if (!user) {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");

    if (!hasSeenSplash) {
      sessionStorage.setItem("hasSeenSplash", "true");
      if (currentPageName !== "Splash" && !isPublicRoute) {
        return <Navigate to={createPageUrl("Splash")} replace />;
      }
    } else if (!isPublicRoute) {
      return <Navigate to={createPageUrl("PhoneInput")} replace />;
    }
  }

  if (user && !hasCompletedOnboarding && currentPageName !== "Welcome") {
    return <Navigate to={createPageUrl("Welcome")} replace />;
  }

  if (user && hasCompletedOnboarding && isPublicRoute && currentPageName !== "ForgotPassword") {
    return <Navigate to={createPageUrl("Home")} replace />;
  }

  return children;
}
