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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  return user || accessToken ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  // Only redirect if user is explicitly set (logged in)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function App() {
  const { loading } = useAuthInit();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="pilot-report" element={<PilotReportPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
