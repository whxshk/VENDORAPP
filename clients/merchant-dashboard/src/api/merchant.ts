import { shouldUseMockData } from './demoMode';
import { apiClient } from './client';
import type {
  DashboardSummary,
  Customer,
  CustomerDetail,
  Transaction,
  Reward,
  Staff,
  Merchant,
  Branch,
  ListCustomersParams,
  ListTransactionsParams,
  CreateRewardParams,
  InviteStaffParams,
  CreateStaffParams,
  CreateLocationParams,
  SimulateScanParams,
  UpdateMerchantSettingsParams,
  ScanResult,
  PilotReport,
} from './types';
import {
  mockCustomers,
  mockTransactions,
  mockRewards,
  mockStaff,
  mockMerchant,
  getMockDashboardSummary,
  getMockPilotReport,
  updateCustomerPoints,
  addMockTransaction,
} from './mockData';

// Dashboard API
export async function getDashboardSummary(locationId?: string): Promise<DashboardSummary> {
  if (shouldUseMockData()) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const summary = getMockDashboardSummary();
    // Ensure all required properties exist
    return {
      todaysCustomers: summary.todaysCustomers || 0,
      repeatCustomers: summary.repeatCustomers || 0,
      totalTransactions: summary.totalTransactions || 0,
      redemptionRate: summary.redemptionRate || 0,
      recentActivity: summary.recentActivity || [],
      alerts: summary.alerts || [],
    };
  }
  
  const params = locationId ? { locationId } : {};
  const response = await apiClient.get('/analytics/dashboard', { params });
  const data = response.data;
  // Ensure all required properties exist
  return {
    todaysCustomers: data.todaysCustomers || 0,
    repeatCustomers: data.repeatCustomers || 0,
    totalTransactions: data.totalTransactions || 0,
    redemptionRate: data.redemptionRate || 0,
    recentActivity: data.recentActivity || [],
    alerts: data.alerts || [],
  };
}

// Customers API
export async function listCustomers(params?: ListCustomersParams): Promise<{ data: Customer[]; total: number }> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let filtered = [...mockCustomers];
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.qrCode.toLowerCase().includes(searchLower)
      );
    }
    
    if (params?.status) {
      filtered = filtered.filter(c => c.status === params.status);
    }
    
    const total = filtered.length;
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: filtered.slice(start, end),
      total,
    };
  }
  
  const response = await apiClient.get('/customers', { params });
  return response.data;
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const customer = mockCustomers.find(c => c.id === id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    const customerTransactions = mockTransactions
      .filter(t => t.customerId === id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Generate points history (last 30 days)
    const pointsHistory: Array<{ date: Date | string; points: number; balance: number }> = [];
    let runningBalance = customer.pointsBalance;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTransactions = customerTransactions.filter(t => {
        const txDate = new Date(t.timestamp);
        return txDate.toDateString() === date.toDateString();
      });
      
      const dayPoints = dayTransactions.reduce((sum, t) => sum + t.points, 0);
      runningBalance -= dayPoints; // Go backwards
      
      pointsHistory.push({
        date: date.toISOString(),
        points: dayPoints,
        balance: Math.max(0, runningBalance),
      });
    }
    
    return {
      ...customer,
      pointsHistory: pointsHistory.reverse(),
      transactions: customerTransactions,
    };
  }
  
  const response = await apiClient.get(`/customers/${id}`);
  return response.data;
}

// Transactions API
export async function listTransactions(params?: ListTransactionsParams): Promise<{ data: Transaction[]; total: number }> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let filtered = [...mockTransactions];
    
    if (params?.startDate) {
      const start = new Date(params.startDate);
      filtered = filtered.filter(t => new Date(t.timestamp) >= start);
    }
    
    if (params?.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.timestamp) <= end);
    }
    
    if (params?.locationId) {
      filtered = filtered.filter(t => t.branchId === params.locationId);
    }
    
    if (params?.type) {
      filtered = filtered.filter(t => t.type === params.type);
    }
    
    if (params?.customerId) {
      filtered = filtered.filter(t => t.customerId === params.customerId);
    }
    
    const total = filtered.length;
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: filtered.slice(start, end),
      total,
    };
  }
  
  const response = await apiClient.get('/transactions', { params });
  return response.data;
}

// Rewards API
export async function listRewards(): Promise<Reward[]> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 150));
    return [...mockRewards];
  }
  
  const response = await apiClient.get('/rewards');
  return response.data;
}

export async function createReward(params: CreateRewardParams): Promise<Reward> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newReward: Reward = {
      id: `reward-${mockRewards.length + 1}`,
      ...params,
      isActive: true,
      createdAt: new Date(),
      tenantId: 'tenant-1',
    };
    
    mockRewards.push(newReward);
    return newReward;
  }
  
  const response = await apiClient.post('/rewards', params);
  return response.data;
}

export async function updateReward(id: string, params: Partial<CreateRewardParams>): Promise<Reward> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockRewards.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Reward not found');
    }
    
    mockRewards[index] = { ...mockRewards[index], ...params };
    return mockRewards[index];
  }
  
  const response = await apiClient.patch(`/rewards/${id}`, params);
  return response.data;
}

export async function deleteReward(id: string): Promise<void> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const index = mockRewards.findIndex(r => r.id === id);
    if (index !== -1) {
      mockRewards.splice(index, 1);
    }
    return;
  }
  
  await apiClient.delete(`/rewards/${id}`);
}

// Staff API
export async function listStaff(): Promise<Staff[]> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 150));
    return [...mockStaff];
  }
  
  const response = await apiClient.get('/staff');
  return response.data;
}

export async function inviteStaff(params: InviteStaffParams): Promise<Staff> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newStaff: Staff = {
      id: `staff-${mockStaff.length + 1}`,
      name: params.email.split('@')[0],
      email: params.email,
      role: params.role,
      status: 'invited',
      createdAt: new Date(),
      tenantId: 'tenant-1',
    };
    
    mockStaff.push(newStaff);
    return newStaff;
  }
  
  const response = await apiClient.post('/staff/invite', params);
  return response.data;
}

export async function createStaff(params: CreateStaffParams): Promise<Staff> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Map backend role to frontend role
    const frontendRole = params.role === 'MERCHANT_ADMIN' ? 'owner' : 
                        params.role === 'MANAGER' ? 'manager' : 'cashier';
    
    const newStaff: Staff = {
      id: `staff-${mockStaff.length + 1}`,
      name: params.name,
      email: params.email,
      role: frontendRole,
      status: 'active',
      createdAt: new Date(),
      tenantId: 'tenant-1',
    };
    
    mockStaff.push(newStaff);
    return newStaff;
  }
  
  const response = await apiClient.post('/users', params);
  // Transform backend response to frontend format
  const role = (response.data.roles as string[])[0] || 'STAFF';
  const frontendRole = role === 'MERCHANT_ADMIN' ? 'owner' : 
                      role === 'MANAGER' ? 'manager' : 'cashier';
  return {
    id: response.data.id,
    name: params.name,
    email: response.data.email,
    role: frontendRole,
    status: response.data.isActive ? 'active' : 'inactive',
    createdAt: response.data.createdAt,
    tenantId: response.data.tenantId,
  };
}

// Merchant Settings API
export async function getMerchantSettings(): Promise<Merchant> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 150));
    return { ...mockMerchant };
  }
  
  const response = await apiClient.get('/merchant/settings');
  return response.data;
}

export async function updateMerchantSettings(params: UpdateMerchantSettingsParams): Promise<Merchant> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    Object.assign(mockMerchant, params);
    return { ...mockMerchant };
  }
  
  const response = await apiClient.patch('/merchant/settings', params);
  return response.data;
}

export async function createLocation(params: CreateLocationParams): Promise<Branch> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newBranch: Branch = {
      id: `branch-${mockMerchant.branches.length + 1}`,
      name: params.name,
      address: params.address,
      isActive: params.isActive !== undefined ? params.isActive : true,
      merchantId: mockMerchant.id,
    };
    
    mockMerchant.branches.push(newBranch);
    return newBranch;
  }
  
  const response = await apiClient.post('/locations', params);
  return {
    id: response.data.id,
    name: response.data.name,
    address: response.data.address,
    isActive: response.data.isActive,
    merchantId: response.data.tenantId, // Using tenantId as merchantId for compatibility
  };
}

// Scan API
export async function simulateScan(params: SimulateScanParams): Promise<ScanResult> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const customer = mockCustomers.find(c => c.id === params.customerId);
    if (!customer) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }
    
    const staff = mockStaff[0]; // Use first staff member
    const branch = mockMerchant.branches[0];
    
    let points = 0;
    let amount: number | undefined;
    let rewardId: string | undefined;
    let rewardName: string | undefined;
    
    if (params.type === 'earn') {
      amount = params.amount || 100;
      points = Math.floor(amount * 0.5); // 0.5 points per QAR
    } else {
      const reward = mockRewards.find(r => r.id === params.rewardId);
      if (!reward) {
        return {
          success: false,
          error: 'Reward not found',
        };
      }
      
      if (customer.pointsBalance < reward.pointsCost) {
        return {
          success: false,
          error: 'Insufficient points',
        };
      }
      
      rewardId = reward.id;
      rewardName = reward.name;
      points = -reward.pointsCost;
    }
    
    // Update customer points
    updateCustomerPoints(customer.id, points);
    
    // Create transaction
    const transaction = addMockTransaction({
      customerId: customer.id,
      customerName: customer.name,
      type: params.type,
      points,
      amount,
      rewardId,
      rewardName,
      staffId: staff.id,
      staffName: staff.name,
      branchId: branch.id,
      branchName: branch.name,
      status: 'completed',
    });
    
    return {
      success: true,
      transaction,
      customer: { ...customer, pointsBalance: customer.pointsBalance },
    };
  }
  
  const response = await apiClient.post('/scans/simulate', params);
  return response.data;
}

export type ScanApplyParams = {
  qrPayload: string;
  purpose: 'CHECKIN' | 'PURCHASE' | 'REDEEM';
  amount?: number;
  rewardId?: string;
};

export async function scanApply(params: ScanApplyParams): Promise<{ success: boolean; purpose: string; customerId?: string; transactionId?: string; balance?: number }> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { success: true, purpose: params.purpose };
  }
  const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const response = await apiClient.post('/scans/apply', params, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return response.data;
}

// Pilot Report API
export async function getPilotReport(week?: string): Promise<PilotReport> {
  if (shouldUseMockData()) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMockPilotReport(week);
  }
  
  const response = await apiClient.get('/analytics/pilot-weekly-report', { params: { week } });
  return response.data;
}
