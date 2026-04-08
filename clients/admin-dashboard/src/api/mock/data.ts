import { subDays, format } from 'date-fns';

// ─── Mock Merchants ────────────────────────────────────────────────────────────

export const MOCK_MERCHANTS = [
  {
    id: 'tenant-001',
    name: 'Brew District',
    category: 'cafe',
    address: 'The Pearl, Doha, Qatar',
    city: 'Doha',
    isActive: true,
    totalCustomers: 342,
    totalTransactions: 1204,
    pointsIssued: 48320,
    pointsRedeemed: 21440,
    createdAt: '2024-01-15T10:00:00Z',
    logoUrl: null,
    phone: '+974 4411 1234',
    email: 'hello@brewdistrict.qa',
    branches: 3,
    staffCount: 8,
  },
  {
    id: 'tenant-002',
    name: 'Sushi Sakura',
    category: 'restaurant',
    address: 'Lusail Marina, Qatar',
    city: 'Lusail',
    isActive: true,
    totalCustomers: 218,
    totalTransactions: 876,
    pointsIssued: 35040,
    pointsRedeemed: 18760,
    createdAt: '2024-02-10T10:00:00Z',
    logoUrl: null,
    phone: '+974 4422 5678',
    email: 'info@sushisakura.qa',
    branches: 1,
    staffCount: 5,
  },
  {
    id: 'tenant-003',
    name: 'FitLife Gym',
    category: 'fitness',
    address: 'West Bay, Doha, Qatar',
    city: 'Doha',
    isActive: true,
    totalCustomers: 485,
    totalTransactions: 2340,
    pointsIssued: 93600,
    pointsRedeemed: 41200,
    createdAt: '2024-01-20T10:00:00Z',
    logoUrl: null,
    phone: '+974 4433 9012',
    email: 'membership@fitlife.qa',
    branches: 2,
    staffCount: 12,
  },
  {
    id: 'tenant-004',
    name: 'Glamour Studio',
    category: 'beauty',
    address: 'Villaggio Mall, Doha',
    city: 'Doha',
    isActive: false,
    totalCustomers: 97,
    totalTransactions: 312,
    pointsIssued: 12480,
    pointsRedeemed: 4200,
    createdAt: '2024-03-05T10:00:00Z',
    logoUrl: null,
    phone: '+974 4444 3456',
    email: 'bookings@glamourstudio.qa',
    branches: 1,
    staffCount: 4,
  },
  {
    id: 'tenant-005',
    name: 'Noon Books',
    category: 'retail',
    address: 'Mall of Qatar, Doha',
    city: 'Doha',
    isActive: true,
    totalCustomers: 156,
    totalTransactions: 531,
    pointsIssued: 21240,
    pointsRedeemed: 9870,
    createdAt: '2024-02-28T10:00:00Z',
    logoUrl: null,
    phone: '+974 4455 7890',
    email: 'hello@noonbooks.qa',
    branches: 2,
    staffCount: 6,
  },
  {
    id: 'tenant-006',
    name: 'FreshMart',
    category: 'grocery',
    address: 'Al Wakra, Qatar',
    city: 'Al Wakra',
    isActive: true,
    totalCustomers: 623,
    totalTransactions: 3102,
    pointsIssued: 124080,
    pointsRedeemed: 53440,
    createdAt: '2023-12-01T10:00:00Z',
    logoUrl: null,
    phone: '+974 4466 1234',
    email: 'support@freshmart.qa',
    branches: 4,
    staffCount: 20,
  },
  {
    id: 'tenant-007',
    name: 'Pixel Gaming',
    category: 'entertainment',
    address: 'Doha Festival City',
    city: 'Doha',
    isActive: true,
    totalCustomers: 284,
    totalTransactions: 1567,
    pointsIssued: 62680,
    pointsRedeemed: 28900,
    createdAt: '2024-01-08T10:00:00Z',
    logoUrl: null,
    phone: '+974 4477 5678',
    email: 'play@pixelgaming.qa',
    branches: 1,
    staffCount: 7,
  },
];

// ─── Mock Customers ────────────────────────────────────────────────────────────

export const MOCK_CUSTOMERS = [
  {
    id: 'cust-001',
    name: 'Ahmad Al-Rashid',
    email: 'ahmad.rashid@gmail.com',
    phone: '+974 5501 1111',
    sharkbandId: 'SB-001-ARSH',
    totalPoints: 4820,
    totalTransactions: 47,
    joinedAt: '2024-01-20T08:00:00Z',
    lastSeen: '2024-04-07T14:22:00Z',
    isActive: true,
    merchantsVisited: ['tenant-001', 'tenant-002', 'tenant-006'],
  },
  {
    id: 'cust-002',
    name: 'Fatima Hassan',
    email: 'fatima.hassan@hotmail.com',
    phone: '+974 5502 2222',
    sharkbandId: 'SB-002-FHAS',
    totalPoints: 12340,
    totalTransactions: 128,
    joinedAt: '2024-01-15T08:00:00Z',
    lastSeen: '2024-04-08T09:11:00Z',
    isActive: true,
    merchantsVisited: ['tenant-001', 'tenant-003', 'tenant-005', 'tenant-007'],
  },
  {
    id: 'cust-003',
    name: 'James Okafor',
    email: 'james.okafor@yahoo.com',
    phone: '+974 5503 3333',
    sharkbandId: 'SB-003-JOKA',
    totalPoints: 2100,
    totalTransactions: 22,
    joinedAt: '2024-02-14T08:00:00Z',
    lastSeen: '2024-04-05T17:45:00Z',
    isActive: true,
    merchantsVisited: ['tenant-003', 'tenant-004'],
  },
  {
    id: 'cust-004',
    name: 'Sara Al-Mansoori',
    email: 'sara.mansoori@gmail.com',
    phone: '+974 5504 4444',
    sharkbandId: 'SB-004-SMAN',
    totalPoints: 7650,
    totalTransactions: 74,
    joinedAt: '2024-01-25T08:00:00Z',
    lastSeen: '2024-04-06T12:30:00Z',
    isActive: true,
    merchantsVisited: ['tenant-001', 'tenant-002', 'tenant-003'],
  },
  {
    id: 'cust-005',
    name: 'Mohammed Al-Thani',
    email: 'mohammed.thani@outlook.com',
    phone: '+974 5505 5555',
    sharkbandId: 'SB-005-MTHA',
    totalPoints: 980,
    totalTransactions: 9,
    joinedAt: '2024-03-10T08:00:00Z',
    lastSeen: '2024-03-28T11:00:00Z',
    isActive: false,
    merchantsVisited: ['tenant-006'],
  },
  {
    id: 'cust-006',
    name: 'Priya Nair',
    email: 'priya.nair@gmail.com',
    phone: '+974 5506 6666',
    sharkbandId: 'SB-006-PNAI',
    totalPoints: 19200,
    totalTransactions: 201,
    joinedAt: '2023-12-05T08:00:00Z',
    lastSeen: '2024-04-08T16:54:00Z',
    isActive: true,
    merchantsVisited: ['tenant-001', 'tenant-002', 'tenant-003', 'tenant-005', 'tenant-006', 'tenant-007'],
  },
  {
    id: 'cust-007',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@gmail.com',
    phone: '+974 5507 7777',
    sharkbandId: 'SB-007-CMEN',
    totalPoints: 3440,
    totalTransactions: 36,
    joinedAt: '2024-02-01T08:00:00Z',
    lastSeen: '2024-04-04T10:20:00Z',
    isActive: true,
    merchantsVisited: ['tenant-002', 'tenant-007'],
  },
  {
    id: 'cust-008',
    name: 'Layla Ibrahim',
    email: 'layla.ibrahim@icloud.com',
    phone: '+974 5508 8888',
    sharkbandId: 'SB-008-LIBR',
    totalPoints: 5920,
    totalTransactions: 58,
    joinedAt: '2024-01-30T08:00:00Z',
    lastSeen: '2024-04-07T19:10:00Z',
    isActive: true,
    merchantsVisited: ['tenant-004', 'tenant-005'],
  },
];

// ─── Mock Audit Trail Transactions ─────────────────────────────────────────────

const MERCHANT_NAMES: Record<string, string> = {
  'tenant-001': 'Brew District',
  'tenant-002': 'Sushi Sakura',
  'tenant-003': 'FitLife Gym',
  'tenant-004': 'Glamour Studio',
  'tenant-005': 'Noon Books',
  'tenant-006': 'FreshMart',
  'tenant-007': 'Pixel Gaming',
};

function makeAuditTrail(customerId: string, merchantIds: string[]) {
  const txs = [];
  let baseDate = new Date('2024-04-08T18:00:00Z');
  let id = 1;

  for (let i = 0; i < 30; i++) {
    baseDate = new Date(baseDate.getTime() - Math.random() * 8 * 60 * 60 * 1000);
    const merchantId = merchantIds[Math.floor(Math.random() * merchantIds.length)];
    const isEarn = Math.random() > 0.3;
    const points = isEarn
      ? Math.round(Math.random() * 200 + 20)
      : -(Math.round(Math.random() * 400 + 100));

    txs.push({
      id: `tx-${customerId}-${id++}`,
      customerId,
      merchantId,
      merchantName: MERCHANT_NAMES[merchantId] || merchantId,
      type: isEarn ? 'earn' : 'redeem',
      points,
      amount: isEarn ? Math.round(Math.abs(points) / 2) : null,
      rewardName: !isEarn ? 'Free Item' : null,
      staffName: 'Staff Member',
      branchName: 'Main Branch',
      timestamp: baseDate.toISOString(),
      isManualAdjustment: false,
      adjustmentReason: null,
    });
  }

  // Add a couple of manual adjustments
  txs.push({
    id: `tx-${customerId}-adj-1`,
    customerId,
    merchantId: merchantIds[0],
    merchantName: MERCHANT_NAMES[merchantIds[0]] || merchantIds[0],
    type: 'adjustment',
    points: 100,
    amount: null,
    rewardName: null,
    staffName: 'Admin',
    branchName: null,
    timestamp: subDays(new Date(), 5).toISOString(),
    isManualAdjustment: true,
    adjustmentReason: 'Compensation for missed scan',
  });

  return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const MOCK_AUDIT_TRAILS: Record<string, ReturnType<typeof makeAuditTrail>> = {};
MOCK_CUSTOMERS.forEach((c) => {
  MOCK_AUDIT_TRAILS[c.id] = makeAuditTrail(c.id, c.merchantsVisited);
});

// ─── Mock Platform Analytics ───────────────────────────────────────────────────

export function getMockPlatformStats() {
  return {
    totalActiveUsers: MOCK_CUSTOMERS.filter((c) => c.isActive).length,
    totalRegisteredMerchants: MOCK_MERCHANTS.length,
    activeMerchants: MOCK_MERCHANTS.filter((m) => m.isActive).length,
    totalTransactions: MOCK_MERCHANTS.reduce((s, m) => s + m.totalTransactions, 0),
    totalPointsIssued: MOCK_MERCHANTS.reduce((s, m) => s + m.pointsIssued, 0),
    totalPointsRedeemed: MOCK_MERCHANTS.reduce((s, m) => s + m.pointsRedeemed, 0),
    totalCustomers: MOCK_CUSTOMERS.length,
  };
}

export function getMock7DayTransactions() {
  return Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const base = 120 + Math.round(Math.sin(i) * 40 + Math.random() * 60);
    return {
      date: format(day, 'MMM d'),
      earn: Math.round(base * 0.7),
      redeem: Math.round(base * 0.3),
      total: base,
    };
  });
}

// ─── Mock Logs ─────────────────────────────────────────────────────────────────

const LOG_LEVELS = ['info', 'warn', 'error'] as const;
const LOG_SOURCES = ['auth', 'scan', 'email', 'ledger', 'api-gateway', 'analytics', 'geocoding'];
const LOG_MESSAGES = [
  'Password reset email dispatched',
  'SMTP warm-up completed in 234ms',
  'JWT verification failed — token expired',
  'Scan processed successfully',
  'Geocoding resolved: The Pearl, Doha',
  'Rate limit exceeded for IP 178.22.x.x',
  'Database connection pool exhausted — retry in 500ms',
  'Tenant not found: unknown-tenant-id',
  'Pilot weekly report generated',
  'Manual adjustment applied: +150 pts',
  'Staff invite email sent',
  'OTP verification succeeded',
  'Invalid QR payload received',
  'Analytics dashboard query took 1240ms',
  'Merchant onboarding completed',
  'Points issuance idempotency key collision prevented duplicate',
];

export const MOCK_LOGS = Array.from({ length: 80 }, (_, i) => {
  const levelWeights = [0.6, 0.3, 0.1];
  const rand = Math.random();
  const level = rand < levelWeights[2] ? 'error' : rand < levelWeights[2] + levelWeights[1] ? 'warn' : 'info';
  const source = LOG_SOURCES[Math.floor(Math.random() * LOG_SOURCES.length)];
  const message = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
  const ts = subDays(new Date(), Math.random() * 7);
  ts.setMinutes(Math.floor(Math.random() * 60));
  ts.setSeconds(Math.floor(Math.random() * 60));

  return {
    id: `log-${i + 1}`,
    timestamp: ts.toISOString(),
    level: level as (typeof LOG_LEVELS)[number],
    source,
    message,
    metadata: level === 'error' ? { stack: 'Error: ...\n  at handler (app.js:142)' } : null,
  };
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
