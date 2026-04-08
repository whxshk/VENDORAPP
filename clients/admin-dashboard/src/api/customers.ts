/**
 * Customer API service.
 *
 * Currently uses mock data. When admin endpoints are available replace with:
 *   GET /admin/customers?search=...
 *   GET /admin/customers/:id/transactions
 *   POST /admin/customers/:id/adjust
 */
import { MOCK_CUSTOMERS, MOCK_AUDIT_TRAILS } from './mock/data';

export type Customer = (typeof MOCK_CUSTOMERS)[number];
export type AuditEntry = ReturnType<typeof MOCK_AUDIT_TRAILS[string][number] extends infer T ? () => T : never>;

export async function searchCustomers(query: string): Promise<Customer[]> {
  const q = query.toLowerCase().trim();
  if (!q) return MOCK_CUSTOMERS;
  return MOCK_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.sharkbandId.toLowerCase().includes(q) ||
      c.phone.includes(q),
  );
}

export async function getCustomer(id: string): Promise<Customer> {
  const found = MOCK_CUSTOMERS.find((c) => c.id === id);
  if (!found) throw new Error('Customer not found');
  return found;
}

export async function getCustomerAuditTrail(customerId: string) {
  return MOCK_AUDIT_TRAILS[customerId] || [];
}

export async function adjustCustomerPoints(
  customerId: string,
  delta: number,
  reason: string,
  adminId: string,
): Promise<{ newBalance: number }> {
  // TODO: replace with real admin endpoint:
  // await apiClient.post(`/admin/customers/${customerId}/adjust`, { delta, reason });
  console.log(`[mock] adjustCustomerPoints(${customerId}, ${delta}, "${reason}", admin=${adminId})`);
  const customer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const newBalance = (customer?.totalPoints || 0) + delta;
  return { newBalance };
}
