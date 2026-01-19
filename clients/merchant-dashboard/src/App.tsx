import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useAuthStore } from './store/authStore';

// Dashboard pages (will be created)
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
  
  // Always require authentication
  return user || accessToken ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1';
  
  // In demo mode, if already authenticated, redirect to dashboard
  if (isDemoMode && (user || accessToken)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // In production mode, redirect if authenticated
  if (!isDemoMode && user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
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
