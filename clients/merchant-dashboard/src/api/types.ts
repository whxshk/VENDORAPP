// Core Entity Types
export interface Customer {
  id: string;
  shortId?: string;
  name: string;
  email?: string;
  phone?: string;
  qrCode: string;
  pointsBalance: number;
  totalVisits: number;
  lastVisit: Date | string;
  status: 'active' | 'inactive';
  createdAt: Date | string;
  tenantId: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'earn' | 'redeem';
  points: number;
  amount?: number; // QAR amount for earn transactions
  rewardId?: string;
  rewardName?: string;
  staffId: string;
  staffName: string;
  branchId?: string;
  branchName?: string;
  timestamp: Date | string;
  status: 'completed' | 'failed' | 'pending';
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'fixed' | 'discount';
  discountPercent?: number;
  isActive: boolean;
  createdAt: Date | string;
  tenantId: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'cashier';
  status: 'active' | 'inactive' | 'invited';
  lastActive?: Date | string;
  createdAt: Date | string;
  tenantId: string;
}

export interface Merchant {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  branches: Branch[];
  createdAt: Date | string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
  merchantId: string;
}

// Dashboard & Analytics Types
export interface DashboardSummary {
  activeCustomers: number;
  repeatCustomers: number;
  totalTransactions: number;
  redemptionRate: number;
  recentActivity: Transaction[];
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date | string;
}

export interface PilotReport {
  week: string;
  summary: {
    improved: string[];
    needsFixing: string[];
  };
  metrics: {
    weekly: {
      activeCustomers: number;
      repeatCustomers: number;
      transactionsTotal: number;
      transactionsIssue: number;
      transactionsRedeem: number;
    };
    daily: Array<{
      date: string;
      activeCustomers: number;
      transactionsIssue: number;
      transactionsRedeem: number;
      scanErrorsTotal: number;
    }>;
  };
  topRewards: Array<{
    rewardId: string;
    rewardName: string;
    redemptionCount: number;
  }>;
}

export interface ScanResult {
  success: boolean;
  transaction?: Transaction;
  customer?: Customer;
  error?: string;
}

export interface CustomerDetail extends Customer {
  pointsHistory: Array<{
    date: Date | string;
    points: number;
    balance: number;
  }>;
  transactions: Transaction[];
}

// API Request/Response Types
export interface ListCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
}

export interface ListTransactionsParams {
  page?: number;
  limit?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  staffId?: string;
  type?: 'earn' | 'redeem';
  customerId?: string;
}

export interface CreateRewardParams {
  name: string;
  description: string;
  pointsCost: number;
  type: 'fixed' | 'discount';
  discountPercent?: number;
}

export interface InviteStaffParams {
  email: string;
  role: 'owner' | 'manager' | 'cashier';
}

export interface SimulateScanParams {
  customerId: string;
  type: 'earn' | 'redeem';
  amount?: number; // For earn
  rewardId?: string; // For redeem
}

export interface UpdateMerchantSettingsParams {
  name?: string;
  description?: string;
  logoUrl?: string;
}

// API Response Wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}
