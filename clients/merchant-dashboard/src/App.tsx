import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useAuthStore } from './store/authStore';
import { useAuthInit } from './hooks/useAuthInit';

import DashboardHome from './pages/dashboard/DashboardHome';
import ScanPage from './pages/dashboard/ScanPage';
import CustomersPage from './pages/dashboard/CustomersPage';
import TransactionsPage from './pages/dashboard/TransactionsPage';
import RewardsPage from './pages/dashboard/RewardsPage';
import StaffPage from './pages/dashboard/StaffPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import PilotReportPage from './pages/PilotReport';
import AcceptInvitePage from './pages/AcceptInvite';
import InviteWelcomePage from './pages/InviteWelcome';
import OnboardingPage from './pages/Onboarding';
import ForgotPasswordPage from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPassword';
import { hasMerchantFullAccess, isScanOnlyUser } from './lib/permissions';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  return user || accessToken ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user) {
    if (isScanOnlyUser(user)) {
      return <Navigate to="/dashboard/scan" replace />;
    }
    const isMerchantAdmin = user.roles?.includes('MERCHANT_ADMIN');
    if (isMerchantAdmin && user.hasCompletedOnboarding === false) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function MerchantAdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return hasMerchantFullAccess(user) ? <>{children}</> : <Navigate to="/dashboard/scan" replace />;
}

function DashboardIndexRoute() {
  const { user } = useAuthStore();
  if (isScanOnlyUser(user)) {
    return <Navigate to="/dashboard/scan" replace />;
  }
  return <DashboardHome />;
}

function App() {
  const { loading } = useAuthInit();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/invite/:inviteToken" element={<AcceptInvitePage />} />
        <Route path="/invite/welcome" element={<InviteWelcomePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardIndexRoute />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="customers" element={<MerchantAdminRoute><CustomersPage /></MerchantAdminRoute>} />
          <Route path="transactions" element={<MerchantAdminRoute><TransactionsPage /></MerchantAdminRoute>} />
          <Route path="rewards" element={<MerchantAdminRoute><RewardsPage /></MerchantAdminRoute>} />
          <Route path="staff" element={<MerchantAdminRoute><StaffPage /></MerchantAdminRoute>} />
          <Route path="settings" element={<MerchantAdminRoute><SettingsPage /></MerchantAdminRoute>} />
          <Route path="pilot-report" element={<MerchantAdminRoute><PilotReportPage /></MerchantAdminRoute>} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
