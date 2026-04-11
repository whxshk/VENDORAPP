import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/api/authService";
import { customerService } from "@/api/customerService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [meResult, profileResult] = await Promise.allSettled([
        authService.me(),
        customerService.getProfile(),
      ]);

      if (meResult.status !== "fulfilled") {
        throw meResult.reason;
      }

      const authUser = meResult.value.data;
      const profile = profileResult.status === "fulfilled" ? profileResult.value.data : null;

      setUser({
        ...authUser,
        full_name: profile?.full_name || authUser.name || authUser.email,
        customerId: profile?.customerId || authUser.customerId || null,
        created_date: profile?.created_date || null,
      });
      // Returning authenticated users skip the welcome/onboarding screen
      localStorage.setItem("hasCompletedOnboarding", "true");
      setHasCompletedOnboarding(true);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { access_token, refresh_token } = res.data;
    localStorage.setItem("access_token", access_token);
    if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
    await checkAuth();
    return res.data;
  };

  const register = async (email, password, name) => {
    const res = await authService.requestRegisterOtp(email, password, name);
    return res.data;
  };

  const verifyOtp = async (email, code, purpose, tenantId) => {
    const res = await authService.verifyOtp(email, code, purpose, tenantId);
    const { access_token, refresh_token } = res.data;
    localStorage.setItem("access_token", access_token);
    if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
    await checkAuth();
    return res.data;
  };

  const completeOnboarding = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    setHasCompletedOnboarding(true);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("hasCompletedOnboarding");
    setUser(null);
    setHasCompletedOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        hasCompletedOnboarding,
        login,
        register,
        verifyOtp,
        completeOnboarding,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
