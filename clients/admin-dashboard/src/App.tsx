import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminGuard } from './guards/AdminGuard';
import { AppLayout } from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Merchants from './pages/Merchants';
import MerchantDetail from './pages/MerchantDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Logs from './pages/Logs';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — admin only */}
        <Route element={<AdminGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/merchants" element={<Merchants />} />
            <Route path="/merchants/:id" element={<MerchantDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/logs" element={<Logs />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
