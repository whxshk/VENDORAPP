import apiClient from './client';

export type PlatformDashboardResponse = {
  stats: {
    totalCustomers: number;
    totalActiveUsers: number;
    totalRegisteredMerchants: number;
    activeMerchants: number;
    totalTransactions: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    redemptionRate: number;
  };
  dailyTrend: Array<{
    date: string;
    earn: number;
    redeem: number;
    uniqueCustomers: number;
    pointsIssued: number;
    pointsRedeemed: number;
  }>;
  merchantsByCategory: Array<{
    category: string;
    count: number;
  }>;
  topMerchants: Array<{
    id: string;
    name: string;
    totalTransactions: number;
    totalCustomers: number;
    pointsIssued: number;
    pointsRedeemed: number;
  }>;
  insights: {
    forecasts: {
      next7DaysTransactions: number;
      next7DaysPointsIssued: number;
      next7DaysPointsRedeemed: number;
      next7DaysActiveCustomers: number;
      transactionTrendPct: number;
      issuedTrendPct: number;
      redeemedTrendPct: number;
      customerTrendPct: number;
    };
    cards: Array<{
      id: string;
      title: string;
      value: string;
      detail: string;
      tone: 'positive' | 'neutral' | 'warning';
    }>;
  };
  scope: {
    merchantId: string | null;
    merchantName: string | null;
  };
  logs: Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    source: string;
    message: string;
    metadata: Record<string, unknown>;
  }>;
};

export async function getPlatformDashboard(merchantId?: string) {
  const response = await apiClient.get<PlatformDashboardResponse>('/platform-admin/dashboard', {
    params: merchantId ? { merchantId } : undefined,
  });
  return response.data;
}
