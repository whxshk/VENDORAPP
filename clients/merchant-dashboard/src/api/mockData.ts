import type {
  Customer,
  Transaction,
  Reward,
  Staff,
  Merchant,
  DashboardSummary,
  PilotReport,
  Alert,
} from './types';

// Mock Merchant Data
export const mockMerchant: Merchant = {
  id: 'merchant-1',
  name: 'BrewLab Café',
  description: 'Premium coffee shop in Doha',
  logoUrl: undefined,
  branches: [
    { id: 'branch-1', name: 'Main Branch', address: 'Doha, Qatar', isActive: true, merchantId: 'merchant-1' },
    { id: 'branch-2', name: 'Mall Branch', address: 'Doha Mall, Qatar', isActive: true, merchantId: 'merchant-1' },
  ],
  createdAt: new Date('2024-01-01'),
};

// Mock Staff Data
export const mockStaff: Staff[] = [
  {
    id: 'staff-1',
    name: 'Ahmed Al-Mansoori',
    email: 'ahmed@brewlabs.com',
    role: 'owner',
    status: 'active',
    lastActive: new Date(),
    createdAt: new Date('2024-01-01'),
    tenantId: 'tenant-1',
  },
  {
    id: 'staff-2',
    name: 'Fatima Hassan',
    email: 'fatima@brewlabs.com',
    role: 'manager',
    status: 'active',
    lastActive: new Date(Date.now() - 3600000),
    createdAt: new Date('2024-01-05'),
    tenantId: 'tenant-1',
  },
  {
    id: 'staff-3',
    name: 'Mohammed Ali',
    email: 'mohammed@brewlabs.com',
    role: 'cashier',
    status: 'active',
    lastActive: new Date(Date.now() - 7200000),
    createdAt: new Date('2024-01-10'),
    tenantId: 'tenant-1',
  },
  {
    id: 'staff-4',
    name: 'Sara Ibrahim',
    email: 'sara@brewlabs.com',
    role: 'cashier',
    status: 'active',
    lastActive: new Date(Date.now() - 1800000),
    createdAt: new Date('2024-01-15'),
    tenantId: 'tenant-1',
  },
];

// Mock Rewards Data
export const mockRewards: Reward[] = [
  {
    id: 'reward-1',
    name: 'Free Latte',
    description: 'Get a free latte with your points',
    pointsCost: 200,
    type: 'fixed',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    tenantId: 'tenant-1',
  },
  {
    id: 'reward-2',
    name: 'Free Pastry',
    description: 'Complimentary pastry of your choice',
    pointsCost: 150,
    type: 'fixed',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    tenantId: 'tenant-1',
  },
  {
    id: 'reward-3',
    name: '10% Discount',
    description: '10% off your total purchase',
    pointsCost: 100,
    type: 'discount',
    discountPercent: 10,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    tenantId: 'tenant-1',
  },
  {
    id: 'reward-4',
    name: 'Free Cappuccino',
    description: 'Enjoy a free cappuccino',
    pointsCost: 180,
    type: 'fixed',
    isActive: true,
    createdAt: new Date('2024-01-05'),
    tenantId: 'tenant-1',
  },
  {
    id: 'reward-5',
    name: '20% Discount',
    description: '20% off your total purchase',
    pointsCost: 250,
    type: 'discount',
    discountPercent: 20,
    isActive: true,
    createdAt: new Date('2024-01-10'),
    tenantId: 'tenant-1',
  },
];

// Mock Customers Data
const customerNames = [
  'Ali Abdullah', 'Fatima Al-Sayed', 'Mohammed Hassan', 'Sara Ibrahim', 'Ahmed Mansoor',
  'Noor Al-Kuwari', 'Khalid Al-Thani', 'Layla Mohammed', 'Omar Ali', 'Mariam Hassan',
  'Yusuf Ibrahim', 'Aisha Al-Mansoori', 'Hamad Al-Suwaidi', 'Zainab Ahmed', 'Tariq Hassan',
  'Hala Ibrahim', 'Rashid Al-Kuwari', 'Nadia Al-Thani', 'Faisal Mohammed', 'Lina Ali',
];

export let mockCustomers: Customer[] = customerNames.map((name, index) => {
  const visits = Math.floor(Math.random() * 20) + 1;
  const points = Math.floor(Math.random() * 1000) + 50;
  const daysAgo = Math.floor(Math.random() * 30);
  
  return {
    id: `customer-${index + 1}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    phone: `+974 ${Math.floor(Math.random() * 9000000) + 1000000}`,
    qrCode: `QR-${String(index + 1).padStart(4, '0')}`,
    pointsBalance: points,
    totalVisits: visits,
    lastVisit: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    status: Math.random() > 0.2 ? 'active' : 'inactive',
    createdAt: new Date(Date.now() - (Math.random() * 90 + 30) * 24 * 60 * 60 * 1000),
    tenantId: 'tenant-1',
  };
});

// Mock Transactions Data
const transactionTypes: Array<'earn' | 'redeem'> = ['earn', 'redeem'];
export let mockTransactions: Transaction[] = [];

// Generate transactions for the last 30 days
for (let i = 0; i < 60; i++) {
  const customer = mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
  const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
  const staff = mockStaff[Math.floor(Math.random() * mockStaff.length)];
  const daysAgo = Math.floor(Math.random() * 30);
  const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  
  let points = 0;
  let amount = 0;
  let rewardId: string | undefined;
  let rewardName: string | undefined;
  
  if (type === 'earn') {
    amount = Math.floor(Math.random() * 200) + 20; // 20-220 QAR
    points = Math.floor(amount * 0.5); // 0.5 points per QAR
  } else {
    const reward = mockRewards[Math.floor(Math.random() * mockRewards.length)];
    rewardId = reward.id;
    rewardName = reward.name;
    points = -reward.pointsCost;
  }
  
  mockTransactions.push({
    id: `tx-${i + 1}`,
    customerId: customer.id,
    customerName: customer.name,
    type,
    points,
    amount: type === 'earn' ? amount : undefined,
    rewardId,
    rewardName,
    staffId: staff.id,
    staffName: staff.name,
    branchId: mockMerchant.branches[Math.floor(Math.random() * mockMerchant.branches.length)].id,
    branchName: mockMerchant.branches[Math.floor(Math.random() * mockMerchant.branches.length)].name,
    timestamp,
    status: Math.random() > 0.1 ? 'completed' : 'failed',
  });
}

// Sort transactions by timestamp (newest first)
mockTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// Mock Dashboard Summary
export function getMockDashboardSummary(): DashboardSummary {
  // Calculate today's customers (distinct customers with transactions today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysTransactions = mockTransactions.filter(t => {
    const txDate = new Date(t.timestamp);
    return txDate >= today;
  });
  const todaysCustomerIds = new Set(todaysTransactions.map(t => t.customerId));
  const todaysCustomers = todaysCustomerIds.size;

  const repeatCustomers = mockCustomers.filter(c => c.totalVisits > 1).length;
  const totalTransactions = mockTransactions.length;
  const earnTransactions = mockTransactions.filter(t => t.type === 'earn' && t.status === 'completed');
  const redeemTransactions = mockTransactions.filter(t => t.type === 'redeem' && t.status === 'completed');
  const totalEarned = earnTransactions.reduce((sum, t) => sum + Math.abs(t.points), 0);
  const totalRedeemed = redeemTransactions.reduce((sum, t) => sum + Math.abs(t.points), 0);
  const redemptionRate = totalEarned > 0 ? Math.round((totalRedeemed / totalEarned) * 100) : 0;
  
  const alerts: Alert[] = [];
  if (todaysCustomers === 0) {
    alerts.push({
      id: 'alert-1',
      type: 'warning',
      message: 'No customers today yet. Start scanning to see activity.',
      timestamp: new Date(),
    });
  }
  if (redemptionRate < 20) {
    alerts.push({
      id: 'alert-2',
      type: 'info',
      message: 'Redemption rate is low. Consider promoting rewards to customers.',
      timestamp: new Date(),
    });
  }
  
  return {
    todaysCustomers,
    repeatCustomers,
    totalTransactions,
    redemptionRate,
    recentActivity: mockTransactions.slice(0, 10),
    alerts,
  };
}

// Mock Pilot Report
export function getMockPilotReport(week?: string): PilotReport {
  const currentWeek = week || `Week ${Math.floor((new Date().getTime() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
  
  const weeklyTransactions = mockTransactions.filter(t => {
    const txDate = new Date(t.timestamp);
    const weekStart = new Date('2024-01-01');
    const weekNum = Math.floor((txDate.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return weekNum === parseInt(currentWeek.replace('Week ', '')) || !week;
  });
  
  const activeCustomersThisWeek = new Set(weeklyTransactions.map(t => t.customerId)).size;
  const repeatCustomersThisWeek = mockCustomers.filter(c => 
    weeklyTransactions.some(t => t.customerId === c.id && c.totalVisits > 1)
  ).length;
  
  return {
    week: currentWeek,
    summary: {
      improved: [
        'Customer retention increased by 15%',
        'Average transaction value up 8%',
        'Redemption rate improved to 32%',
      ],
      needsFixing: [
        'Some staff members need training on reward redemption',
        'Peak hours need better coverage',
      ],
    },
    metrics: {
      weekly: {
        activeCustomers: activeCustomersThisWeek,
        repeatCustomers: repeatCustomersThisWeek,
        transactionsTotal: weeklyTransactions.length,
        transactionsIssue: weeklyTransactions.filter(t => t.type === 'earn').length,
        transactionsRedeem: weeklyTransactions.filter(t => t.type === 'redeem').length,
      },
      daily: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayTransactions = weeklyTransactions.filter(t => {
          const txDate = new Date(t.timestamp);
          return txDate.toDateString() === date.toDateString();
        });
        return {
          date: date.toISOString().split('T')[0],
          activeCustomers: new Set(dayTransactions.map(t => t.customerId)).size,
          transactionsIssue: dayTransactions.filter(t => t.type === 'earn').length,
          transactionsRedeem: dayTransactions.filter(t => t.type === 'redeem').length,
          scanErrorsTotal: Math.floor(Math.random() * 3),
        };
      }),
    },
    topRewards: mockRewards.slice(0, 3).map(r => ({
      rewardId: r.id,
      rewardName: r.name,
      redemptionCount: mockTransactions.filter(t => t.rewardId === r.id).length,
    })),
  };
}

// Helper function to update customer points after transaction
export function updateCustomerPoints(customerId: string, points: number): void {
  const customer = mockCustomers.find(c => c.id === customerId);
  if (customer) {
    customer.pointsBalance += points;
    customer.totalVisits += 1;
    customer.lastVisit = new Date();
  }
}

// Helper function to add new transaction
export function addMockTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
  const newTransaction: Transaction = {
    ...transaction,
    id: `tx-${mockTransactions.length + 1}`,
    timestamp: new Date(),
    status: 'completed',
  };
  mockTransactions.unshift(newTransaction); // Add to beginning
  return newTransaction;
}
