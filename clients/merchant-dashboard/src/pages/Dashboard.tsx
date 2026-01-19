import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi, fraudSignalsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface DashboardData {
  totalCustomers?: number;
  totalTransactions?: number;
  totalBalance?: number;
  totalScans?: number;
  pointsIssued?: number;
  pointsRedeemed?: number;
  conversionRate?: number;
  totalRevenue?: number;
  returningCustomers?: number;
  newCustomers?: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [signals, setSignals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadDashboard = async () => {
      try {
        setError(null);
        const [dashboardResponse, signalsResponse] = await Promise.all([
          analyticsApi.getDashboard(),
          fraudSignalsApi.getSignals().catch(() => null),
        ]);
        setData(dashboardResponse.data);
        setSignals(signalsResponse?.data || null);
        setLastUpdate(new Date());
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="loading">
        <div>Loading dashboard...</div>
      </div>
    );
  }

  const isEmpty = !data || (data.totalCustomers === 0 && data.totalTransactions === 0);
  const hasSignals = signals && signals.signals && signals.signals.length > 0;
  
  // Calculate derived metrics
  const totalScans = data?.totalScans || data?.totalTransactions || 0;
  const pointsIssued = data?.pointsIssued || 0;
  const pointsRedeemed = data?.pointsRedeemed || 0;
  const conversionRate = pointsIssued > 0 
    ? Math.round((pointsRedeemed / pointsIssued) * 100) 
    : 0;
  const totalRevenue = data?.totalRevenue || 0;
  const returningCustomers = data?.returningCustomers || 0;
  const newCustomers = (data?.totalCustomers || 0) - returningCustomers;
  const returningPercentage = (data?.totalCustomers || 0) > 0
    ? Math.round((returningCustomers / (data?.totalCustomers || 1)) * 100)
    : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0c1829' }}>
      {/* Header */}
      <div className="page-header" style={{ 
        padding: '2rem 2rem 1rem',
        background: 'rgba(12, 24, 41, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 className="page-title" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #9333ea 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
          display: 'inline-block'
        }}>
          Merchant Dashboard
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/pilot-report')} 
            className="btn btn-outline"
            style={{ fontSize: '0.875rem' }}
          >
            Pilot Report
          </button>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '3rem' }}>
        {/* Error Alert */}
        {error && !data && (
          <div className="alert alert-error">
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Error Loading Dashboard</h3>
            <p style={{ marginBottom: '1rem' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
              style={{ fontSize: '0.875rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Warning Alert */}
        {error && data && (
          <div className="alert alert-warning">
            ⚠️ Warning: {error}
          </div>
        )}

        {/* Fraud Signals Alert */}
        {hasSignals && (
          <div className="alert alert-warning">
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>⚠️ Activity Signals</h3>
            <ul style={{ marginBottom: '0.5rem', paddingLeft: '1.5rem' }}>
              {signals.signals.map((signal: string, idx: number) => (
                <li key={idx}>{signal}</li>
              ))}
            </ul>
            <small style={{ color: 'inherit', opacity: 0.8 }}>
              Scans (last hour): {signals.scansLastHour || 0} | 
              Redemptions (last day): {signals.redemptionsLastDay || 0} |
              Failed (last day): {signals.failedRedemptionsLastDay || 0}
            </small>
          </div>
        )}

        {/* Success Alert */}
        {!error && data && (
          <div className="alert alert-success" style={{ marginBottom: '2rem' }}>
            ✓ Dashboard is operational. Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {/* Empty State */}
        {isEmpty ? (
          <div className="empty-state">
            <h2 className="empty-state-title">Welcome to SharkBand!</h2>
            <p className="empty-state-text">
              You haven't processed any transactions yet.
            </p>
            <p className="empty-state-subtext">
              Start by setting up your staff devices and processing your first customer scan.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
              <div className="stats-card" style={{
                background: 'rgba(59, 130, 246, 0.15)',
                borderColor: 'rgba(59, 130, 246, 0.3)'
              }}>
                <div className="stats-label">Total Scans</div>
                <div className="stats-value" style={{ color: '#3b82f6' }}>{totalScans.toLocaleString()}</div>
                <div className="stats-description">Starting fresh</div>
              </div>
              
              <div className="stats-card" style={{
                background: 'rgba(34, 197, 94, 0.15)',
                borderColor: 'rgba(34, 197, 94, 0.3)'
              }}>
                <div className="stats-label">Points Issued</div>
                <div className="stats-value" style={{ color: '#22c55e' }}>{pointsIssued.toLocaleString()}</div>
                <div className="stats-description">Starting fresh</div>
              </div>
              
              <div className="stats-card" style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}>
                <div className="stats-label">Points Redeemed</div>
                <div className="stats-value" style={{ color: '#ef4444' }}>{pointsRedeemed.toLocaleString()}</div>
                <div className="stats-description">Starting fresh</div>
              </div>
            </div>

            <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
              <div className="stats-card" style={{
                background: 'rgba(147, 51, 234, 0.15)',
                borderColor: 'rgba(147, 51, 234, 0.3)'
              }}>
                <div className="stats-label">Conversion Rate</div>
                <div className="stats-value" style={{ color: '#9333ea' }}>{conversionRate}%</div>
                <div className="stats-description">Redeem/Issue ratio</div>
              </div>
              
              <div className="stats-card" style={{
                background: 'rgba(251, 146, 60, 0.15)',
                borderColor: 'rgba(251, 146, 60, 0.3)'
              }}>
                <div className="stats-label">Total Revenue</div>
                <div className="stats-value" style={{ color: '#f59e0b' }}>{totalRevenue.toLocaleString()} QAR</div>
                <div className="stats-description">Starting fresh</div>
              </div>
              
              <div className="stats-card" style={{
                background: 'rgba(6, 182, 212, 0.15)',
                borderColor: 'rgba(6, 182, 212, 0.3)'
              }}>
                <div className="stats-label">Total Customers</div>
                <div className="stats-value" style={{ color: '#06b6d4' }}>{(data?.totalCustomers || 0).toLocaleString()}</div>
                <div className="stats-description">
                  {returningCustomers} returning ({returningPercentage}%)
                </div>
              </div>
            </div>

            {/* Customer Breakdown */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 className="card-title">Customer Breakdown</h3>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}>
                    {returningCustomers}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(241, 245, 249, 0.6)', marginTop: '0.25rem' }}>
                    Returning ({returningPercentage}%)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>
                    {newCustomers}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(241, 245, 249, 0.6)', marginTop: '0.25rem' }}>
                    New ({100 - returningPercentage}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="card-title">Recent Activity</h3>
              <div style={{ color: 'rgba(241, 245, 249, 0.6)', textAlign: 'center', padding: '2rem' }}>
                No activity yet today
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
