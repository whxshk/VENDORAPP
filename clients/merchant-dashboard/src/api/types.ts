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
  amount?: number; // QAR amount for earn, stamp count for stamp transactions
  stampIssued?: boolean; // true when this was a stamp issuance (not points)
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
  rewardType: 'points' | 'stamps';
  pointsCost?: number;
  stampsCost?: number;
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
  role: 'owner' | 'manager' | 'cashier' | 'staff' | 'janitor';
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
  category?: string;
  pointsPerQar?: number;
  config?: Record<string, any>;
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

export interface CreateLocationParams {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface UpdateLocationParams {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

// Dashboard & Analytics Types
export interface DashboardSummary {
  todaysCustomers: number;
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
  loyaltyType?: string;
  stampsRequired?: number;
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
  locationId?: string;
  type?: 'earn' | 'redeem';
  customerId?: string;
}

export interface CreateRewardParams {
  name: string;
  description: string;
  rewardType: 'points' | 'stamps';
  pointsCost?: number;
  stampsCost?: number;
  type: 'fixed' | 'discount';
  discountPercent?: number;
}

export interface InviteStaffParams {
  email: string;
  role: 'owner' | 'manager' | 'cashier' | 'staff' | 'janitor';
}

export interface InviteDetails {
  email: string;
  role: 'MERCHANT_ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF' | 'JANITOR';
  tenantName: string;
  expiresAt: Date | string;
}

export interface AcceptInviteParams {
  inviteToken: string;
  name: string;
}

export interface CreateStaffParams {
  name: string;
  email: string;
  password: string;
  role: 'MERCHANT_ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF' | 'JANITOR';
  locationId?: string;
}

export interface UpdateStaffParams {
  id: string;
  name?: string;
  email?: string;
  role?: 'owner' | 'manager' | 'cashier' | 'janitor' | 'staff';
  password?: string;
}

export interface SimulateScanParams {
  customerId: string;
  type: 'earn' | 'redeem';
  amount?: number; // For earn
  rewardId?: string; // For redeem
  locationId?: string; // Branch where the transaction occurs
}

export interface UpdateMerchantSettingsParams {
  name?: string;
  description?: string;
  logoUrl?: string;
  category?: string;
  pointsPerQar?: number;
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
