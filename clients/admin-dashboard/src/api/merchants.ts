import apiClient from './client';

export interface Merchant {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  isActive: boolean;
  totalCustomers: number;
  totalTransactions: number;
  pointsIssued: number;
  pointsRedeemed: number;
  createdAt: string;
  logoUrl: string | null;
  phone: string;
  email: string;
  branches: number;
  staffCount: number;
  chartData?: Array<{
    date: string;
    total: number;
    earn: number;
    redeem: number;
  }>;
}

export interface MerchantCustomer {
  id: string;
  name: string;
  email: string;
  sharkbandId: string;
  totalPoints: number;
  totalRedeemed: number;
  totalTransactions: number;
  joinedAt: string;
  lastSeen: string;
  membershipStatus: string;
  isActive: boolean;
}

export async function listMerchants(): Promise<Merchant[]> {
  const res = await apiClient.get<Merchant[]>('/platform-admin/merchants');
  return res.data;
}

export async function getMerchant(id: string): Promise<Merchant> {
  const res = await apiClient.get<Merchant>(`/platform-admin/merchants/${id}`);
  return res.data;
}

export async function getMerchantCustomers(
  id: string,
  params?: {
    search?: string;
    sortBy?: 'lastSeen' | 'joinedAt' | 'points' | 'redemption' | 'transactions' | 'name';
    order?: 'asc' | 'desc';
    status?: 'all' | 'active' | 'inactive';
  },
): Promise<MerchantCustomer[]> {
  const res = await apiClient.get<MerchantCustomer[]>(`/platform-admin/merchants/${id}/customers`, {
    params,
  });
  return res.data;
}

export async function updateMerchantStatus(id: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/platform-admin/merchants/${id}/status`, { isActive });
}
