/**
 * Merchant API service.
 *
 * Real calls: GET /merchants (public — lists active merchants)
 * Mock data: admin-scoped fields (totalCustomers, totalTransactions, etc.)
 * When admin endpoints exist on the backend, replace MOCK_MERCHANTS with
 * apiClient.get('/admin/merchants') calls.
 */
import apiClient from './client';
import { MOCK_MERCHANTS } from './mock/data';

export type Merchant = (typeof MOCK_MERCHANTS)[number];

export async function listMerchants(): Promise<Merchant[]> {
  // Real public endpoint enriched with mock admin fields
  try {
    const res = await apiClient.get('/merchants');
    const realMerchants: any[] = res.data;

    // Merge real data with mock admin stats, falling back to mock-only for demo
    return realMerchants.map((m: any, i: number) => ({
      ...MOCK_MERCHANTS[i % MOCK_MERCHANTS.length],
      id: m.id || MOCK_MERCHANTS[i % MOCK_MERCHANTS.length].id,
      name: m.name || MOCK_MERCHANTS[i % MOCK_MERCHANTS.length].name,
      category: m.category || MOCK_MERCHANTS[i % MOCK_MERCHANTS.length].category,
      address: m.address || MOCK_MERCHANTS[i % MOCK_MERCHANTS.length].address,
      isActive: m.isActive ?? MOCK_MERCHANTS[i % MOCK_MERCHANTS.length].isActive,
      logoUrl: m.logoUrl || null,
    }));
  } catch {
    // Fall back to full mock data if network unavailable
    return MOCK_MERCHANTS;
  }
}

export async function getMerchant(id: string): Promise<Merchant> {
  const all = await listMerchants();
  const found = all.find((m) => m.id === id);
  if (!found) throw new Error('Merchant not found');
  return found;
}

export async function updateMerchantStatus(id: string, isActive: boolean): Promise<void> {
  // TODO: replace with real admin endpoint when available
  // await apiClient.patch(`/admin/merchants/${id}`, { isActive });
  console.log(`[mock] updateMerchantStatus(${id}, ${isActive})`);
}

export async function createMerchant(data: {
  name: string;
  email: string;
  category: string;
  address: string;
  phone: string;
}): Promise<void> {
  // TODO: replace with real admin endpoint when available
  // await apiClient.post('/admin/merchants', data);
  console.log('[mock] createMerchant', data);
}
