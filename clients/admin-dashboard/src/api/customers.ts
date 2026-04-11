import apiClient from './client';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  sharkbandId: string;
  totalPoints: number;
  totalTransactions: number;
  joinedAt: string;
  lastSeen: string;
  isActive: boolean;
  merchantsVisited: string[];
}

export interface AuditEntry {
  id: string;
  customerId: string;
  merchantId: string;
  merchantName: string;
  type: 'earn' | 'redeem' | 'adjustment';
  points: number;
  amount: number | null;
  rewardName: string | null;
  staffName: string;
  branchName: string | null;
  timestamp: string;
  isManualAdjustment: boolean;
  adjustmentReason: string | null;
}

export interface CustomerDetail extends Customer {
  auditTrail: AuditEntry[];
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const res = await apiClient.get<Customer[]>('/platform-admin/customers', {
    params: query.trim() ? { search: query.trim() } : undefined,
  });
  return res.data;
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  const res = await apiClient.get<CustomerDetail>(`/platform-admin/customers/${id}`);
  return res.data;
}

export async function getCustomerAuditTrail(customerId: string): Promise<AuditEntry[]> {
  const res = await apiClient.get<AuditEntry[]>(`/platform-admin/customers/${customerId}/audit-trail`);
  return res.data;
}
