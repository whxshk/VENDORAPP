import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { User, UserDocument } from '../database/schemas/User.schema';
import { Customer, CustomerDocument } from '../database/schemas/Customer.schema';
import {
  CustomerMerchantAccount,
  CustomerMerchantAccountDocument,
} from '../database/schemas/CustomerMerchantAccount.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
  TransactionType,
} from '../database/schemas/Transaction.schema';
import { AuditLog, AuditLogDocument } from '../database/schemas/AuditLog.schema';
import {
  LoyaltyLedgerEntry,
  LoyaltyLedgerEntryDocument,
} from '../database/schemas/LoyaltyLedgerEntry.schema';
import { Location, LocationDocument } from '../database/schemas/Location.schema';

type DailyPlatformRow = {
  date: string;
  earn: number;
  redeem: number;
  uniqueCustomers: number;
  pointsIssued: number;
  pointsRedeemed: number;
};

type MerchantCustomerSortBy =
  | 'lastSeen'
  | 'joinedAt'
  | 'points'
  | 'redemption'
  | 'transactions'
  | 'name';

type MerchantCustomerFilters = {
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: 'all' | 'active' | 'inactive';
};

@Injectable()
export class PlatformAdminService {
  private static readonly PLATFORM_TENANT_ID = 'sharkband-platform';

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerMerchantAccount.name)
    private accountModel: Model<CustomerMerchantAccountDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(LoyaltyLedgerEntry.name)
    private ledgerModel: Model<LoyaltyLedgerEntryDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}

  async getPlatformDashboard(merchantId?: string) {
    const now = new Date();
    const scopedMerchantId =
      merchantId && merchantId !== PlatformAdminService.PLATFORM_TENANT_ID ? merchantId : undefined;
    const merchantQuery = scopedMerchantId
      ? { _id: scopedMerchantId }
      : { _id: { $ne: PlatformAdminService.PLATFORM_TENANT_ID } };
    const txQuery = {
      tenantId: scopedMerchantId
        ? scopedMerchantId
        : { $ne: PlatformAdminService.PLATFORM_TENANT_ID },
      status: TransactionStatus.COMPLETED,
    };
    const accountQuery = scopedMerchantId
      ? { tenantId: scopedMerchantId }
      : { tenantId: { $ne: PlatformAdminService.PLATFORM_TENANT_ID } };

    const thirtyDaysAgo = this.startOfDay(this.addDays(now, -29));
    const last14DaysStart = this.startOfDay(this.addDays(now, -13));
    const last7DaysStart = this.startOfDay(this.addDays(now, -6));
    const previous7DaysStart = this.startOfDay(this.addDays(now, -13));
    const previous7DaysEnd = this.endOfDay(this.addDays(now, -7));
    const logs7DaysAgo = this.startOfDay(this.addDays(now, -6));

    const [
      totalRegisteredMerchants,
      activeMerchants,
      totalCustomers,
      totalTransactions,
      activeCustomerRows,
      issueAgg,
      redeemAgg,
      trendAgg,
      topMerchantsAgg,
      merchantCategories,
      failedRedemptions7d,
      adjustmentActions7d,
      recentAuditLogs,
    ] = await Promise.all([
      this.tenantModel.countDocuments(merchantQuery).exec(),
      this.tenantModel.countDocuments({ ...merchantQuery, isActive: true }).exec(),
      scopedMerchantId
        ? this.accountModel.countDocuments(accountQuery).exec()
        : this.userModel.countDocuments({
            customerId: { $exists: true, $nin: ['', null] },
          }).exec(),
      this.transactionModel.countDocuments(txQuery).exec(),
      this.transactionModel.aggregate([
        {
          $match: {
            ...txQuery,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        { $group: { _id: '$customerId' } },
      ]).exec(),
      this.transactionModel.aggregate([
        {
          $match: {
            ...txQuery,
            type: TransactionType.ISSUE,
            'metadata.stampIssued': { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: { $toDouble: '$amount' } },
          },
        },
      ]).exec(),
      this.transactionModel.aggregate([
        {
          $match: {
            ...txQuery,
            type: TransactionType.REDEEM,
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: { $abs: { $toDouble: '$amount' } } },
          },
        },
      ]).exec(),
      this.transactionModel.aggregate([
        {
          $match: {
            ...txQuery,
            createdAt: { $gte: last14DaysStart },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                },
              },
              type: '$type',
            },
            count: { $sum: 1 },
            totalAmount: { $sum: { $toDouble: '$amount' } },
            customers: { $addToSet: '$customerId' },
          },
        },
      ]).exec(),
      this.transactionModel.aggregate([
        { $match: txQuery },
        {
          $group: {
            _id: '$tenantId',
            totalTransactions: { $sum: 1 },
            totalCustomersSet: { $addToSet: '$customerId' },
            pointsIssued: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$type', TransactionType.ISSUE] },
                      { $ne: ['$metadata.stampIssued', true] },
                    ],
                  },
                  { $toDouble: '$amount' },
                  0,
                ],
              },
            },
            pointsRedeemed: {
              $sum: {
                $cond: [
                  { $eq: ['$type', TransactionType.REDEEM] },
                  { $abs: { $toDouble: '$amount' } },
                  0,
                ],
              },
            },
          },
        },
        { $sort: { totalTransactions: -1 } },
        { $limit: 5 },
      ]).exec(),
      this.tenantModel
        .find(merchantQuery)
        .select('_id name config isActive createdAt')
        .lean()
        .exec(),
      this.auditLogModel.countDocuments({
        action: 'REDEMPTION_FAILED',
        createdAt: { $gte: logs7DaysAgo },
      }).exec(),
      this.auditLogModel.countDocuments({
        action: 'MANUAL_ADJUSTMENT',
        createdAt: { $gte: logs7DaysAgo },
      }).exec(),
      this.auditLogModel
        .find({ createdAt: { $gte: logs7DaysAgo } })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
        .exec(),
    ]);

    const issueRow = issueAgg[0] ?? { count: 0, total: 0 };
    const redeemRow = redeemAgg[0] ?? { count: 0, total: 0 };
    const totalPointsIssued = Math.round(issueRow.total ?? 0);
    const totalPointsRedeemed = Math.round(redeemRow.total ?? 0);
    const totalIssueCount = issueRow.count ?? 0;
    const totalRedeemCount = redeemRow.count ?? 0;
    const redemptionRate =
      totalIssueCount > 0 ? Number((totalRedeemCount / totalIssueCount).toFixed(4)) : 0;

    const dailyTrend = this.buildDailyTrend(last14DaysStart, trendAgg);
    const merchantsByCategory = this.buildCategoryBreakdown(merchantCategories);
    const merchantNameMap = new Map(
      merchantCategories.map((merchant: any) => [merchant._id, merchant.name]),
    );
    const selectedMerchant = scopedMerchantId
      ? merchantCategories.find((merchant: any) => merchant._id === scopedMerchantId) || null
      : null;

    const topMerchants = topMerchantsAgg.map((row: any) => ({
      id: row._id,
      name: merchantNameMap.get(row._id) || row._id,
      totalTransactions: row.totalTransactions,
      totalCustomers: Array.isArray(row.totalCustomersSet) ? row.totalCustomersSet.length : 0,
      pointsIssued: Math.round(row.pointsIssued ?? 0),
      pointsRedeemed: Math.round(row.pointsRedeemed ?? 0),
    }));

    const forecasts = this.buildForecasts(dailyTrend);
    const insightCards = this.buildInsightCards({
      dailyTrend,
      forecasts,
      failedRedemptions7d,
      adjustmentActions7d,
      activeMerchants,
      totalRegisteredMerchants,
    });

    const logs = recentAuditLogs.map((log: any) => ({
      id: log._id,
      timestamp: log.createdAt,
      level: this.mapAuditLogLevel(log.action),
      source: log.resourceType || 'system',
      message: this.humanizeAuditAction(log),
      metadata: log.metadata || {},
    }));

    return {
      stats: {
        totalCustomers,
        totalActiveUsers: activeCustomerRows.length,
        totalRegisteredMerchants,
        activeMerchants,
        totalTransactions,
        totalPointsIssued,
        totalPointsRedeemed,
        redemptionRate,
      },
      dailyTrend,
      merchantsByCategory,
      topMerchants,
      scope: {
        merchantId: scopedMerchantId || null,
        merchantName: selectedMerchant?.name || null,
      },
      insights: {
        forecasts,
        cards: insightCards,
      },
      logs,
    };
  }

  async listMerchants() {
    const merchantQuery = { _id: { $ne: PlatformAdminService.PLATFORM_TENANT_ID } };
    const [tenants, txAgg, accountAgg, locationAgg, staffAgg] = await Promise.all([
      this.tenantModel.find(merchantQuery).sort({ name: 1 }).lean().exec(),
      this.transactionModel.aggregate([
        {
          $match: {
            tenantId: { $ne: PlatformAdminService.PLATFORM_TENANT_ID },
            status: TransactionStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: '$tenantId',
            totalTransactions: { $sum: 1 },
            pointsIssued: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$type', TransactionType.ISSUE] },
                      { $ne: ['$metadata.stampIssued', true] },
                    ],
                  },
                  { $toDouble: '$amount' },
                  0,
                ],
              },
            },
            pointsRedeemed: {
              $sum: {
                $cond: [
                  { $eq: ['$type', TransactionType.REDEEM] },
                  { $abs: { $toDouble: '$amount' } },
                  0,
                ],
              },
            },
          },
        },
      ]).exec(),
      this.accountModel.aggregate([
        {
          $group: {
            _id: '$tenantId',
            totalCustomers: { $sum: 1 },
          },
        },
      ]).exec(),
      this.locationModel.aggregate([
        {
          $group: {
            _id: '$tenantId',
            branches: { $sum: 1 },
          },
        },
      ]).exec(),
      this.userModel.aggregate([
        {
          $match: {
            tenantId: { $ne: PlatformAdminService.PLATFORM_TENANT_ID },
            $or: [{ customerId: { $exists: false } }, { customerId: '' }, { customerId: null }],
          },
        },
        {
          $group: {
            _id: '$tenantId',
            staffCount: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    const txMap = new Map(txAgg.map((row: any) => [row._id, row]));
    const accountMap = new Map(accountAgg.map((row: any) => [row._id, row.totalCustomers]));
    const locationMap = new Map(locationAgg.map((row: any) => [row._id, row.branches]));
    const staffMap = new Map(staffAgg.map((row: any) => [row._id, row.staffCount]));

    return tenants.map((tenant: any) => {
      const tx = txMap.get(tenant._id) || {};
      const config = tenant.config || {};
      return {
        id: tenant._id,
        name: tenant.name,
        category: config.category || 'other',
        address: config.formatted_address || config.address || '',
        city: this.extractCity(config.formatted_address || config.address || ''),
        isActive: tenant.isActive !== false,
        totalCustomers: accountMap.get(tenant._id) || 0,
        totalTransactions: tx.totalTransactions || 0,
        pointsIssued: Math.round(tx.pointsIssued || 0),
        pointsRedeemed: Math.round(tx.pointsRedeemed || 0),
        createdAt: tenant.createdAt,
        logoUrl: config.logo_url || null,
        phone: config.phone || '',
        email: config.email || '',
        branches: locationMap.get(tenant._id) || 0,
        staffCount: staffMap.get(tenant._id) || 0,
      };
    });
  }

  async getMerchantDetail(tenantId: string) {
    const tenant = await this.tenantModel.findById(tenantId).lean().exec();
    if (!tenant || tenant._id === PlatformAdminService.PLATFORM_TENANT_ID) {
      return null;
    }

    const [merchants, trendAgg] = await Promise.all([
      this.listMerchants(),
      this.transactionModel.aggregate([
        {
          $match: {
            tenantId,
            status: TransactionStatus.COMPLETED,
            createdAt: { $gte: this.startOfDay(this.addDays(new Date(), -6)) },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                },
              },
              type: '$type',
            },
            count: { $sum: 1 },
          },
        },
      ]).exec(),
    ]);

    const merchant = merchants.find((item) => item.id === tenantId);
    if (!merchant) return null;

    const chartData = [];
    const trendMap = new Map(trendAgg.map((row: any) => [`${row._id.date}:${row._id.type}`, row.count]));
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = this.addDays(new Date(), -offset);
      const date = this.toDateKey(day);
      const earn = trendMap.get(`${date}:${TransactionType.ISSUE}`) || 0;
      const redeem = trendMap.get(`${date}:${TransactionType.REDEEM}`) || 0;
      chartData.push({
        date,
        total: earn + redeem,
        earn,
        redeem,
      });
    }

    return {
      ...merchant,
      chartData,
    };
  }

  async listMerchantCustomers(tenantId: string, filters: MerchantCustomerFilters = {}) {
    const tenant = await this.tenantModel.findById(tenantId).select('_id name').lean().exec();
    if (!tenant || tenant._id === PlatformAdminService.PLATFORM_TENANT_ID) {
      return [];
    }

    const accounts = await this.accountModel.find({ tenantId }).lean().exec();
    if (accounts.length === 0) {
      return [];
    }

    const customerIds = [...new Set(accounts.map((account: any) => account.customerId).filter(Boolean))];
    const [users, txAgg, ledgerAgg] = await Promise.all([
      this.userModel
        .find({ customerId: { $in: customerIds } })
        .select('customerId name email isActive createdAt updatedAt')
        .lean()
        .exec(),
      this.transactionModel.aggregate([
        {
          $match: {
            tenantId,
            status: TransactionStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: '$customerId',
            totalTransactions: { $sum: 1 },
            lastSeen: { $max: '$createdAt' },
            totalRedeemed: {
              $sum: {
                $cond: [
                  { $eq: ['$type', TransactionType.REDEEM] },
                  { $abs: { $toDouble: '$amount' } },
                  0,
                ],
              },
            },
          },
        },
      ]).exec(),
      this.ledgerModel.aggregate([
        { $match: { tenantId, customerId: { $in: customerIds } } },
        {
          $group: {
            _id: '$customerId',
            totalPoints: { $sum: { $toDouble: '$amount' } },
          },
        },
      ]).exec(),
    ]);

    const txMap = new Map(txAgg.map((row: any) => [row._id, row]));
    const pointsMap = new Map(
      ledgerAgg.map((row: any) => [row._id, Math.round(Number(row.totalPoints || 0))]),
    );
    const accountMap = new Map(accounts.map((account: any) => [account.customerId, account]));

    const searchTerm = filters.search?.trim().toLowerCase() || '';
    const statusFilter = filters.status || 'all';
    const sortBy = (filters.sortBy || 'lastSeen') as MerchantCustomerSortBy;
    const order = filters.order === 'asc' ? 'asc' : 'desc';

    const rows = users
      .map((user: any) => {
        const account = accountMap.get(user.customerId);
        const tx = txMap.get(user.customerId) || {};
        const joinedAt = account?.createdAt || user.createdAt;
        const lastSeen = tx.lastSeen || account?.updatedAt || user.updatedAt || joinedAt;
        const totalRedeemed = Math.round(Number(tx.totalRedeemed || 0));
        const totalPoints = pointsMap.get(user.customerId) || 0;
        const isMembershipActive = account?.membershipStatus === 'ACTIVE';

        return {
          id: user.customerId,
          name: user.name || user.email?.split('@')[0] || 'Customer',
          email: user.email,
          sharkbandId: this.toSharkbandId(user.customerId),
          totalPoints,
          totalRedeemed,
          totalTransactions: Number(tx.totalTransactions || 0),
          joinedAt,
          lastSeen,
          membershipStatus: account?.membershipStatus || 'INACTIVE',
          isActive: user.isActive !== false && isMembershipActive,
        };
      })
      .filter((row) => {
        if (statusFilter === 'active' && !row.isActive) return false;
        if (statusFilter === 'inactive' && row.isActive) return false;
        if (!searchTerm) return true;

        return [row.name, row.email, row.sharkbandId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchTerm));
      });

    rows.sort((a, b) => {
      const direction = order === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'joinedAt':
          return direction * (new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
        case 'points':
          return direction * (a.totalPoints - b.totalPoints);
        case 'redemption':
          return direction * (a.totalRedeemed - b.totalRedeemed);
        case 'transactions':
          return direction * (a.totalTransactions - b.totalTransactions);
        case 'lastSeen':
        default:
          return direction * (new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime());
      }
    });

    return rows;
  }

  async updateMerchantStatus(tenantId: string, isActive: boolean) {
    await this.tenantModel.updateOne({ _id: tenantId }, { isActive }).exec();
    return { id: tenantId, isActive };
  }

  async listCustomers(search?: string) {
    const query: any = {
      customerId: { $exists: true, $nin: ['', null] },
    };

    if (search?.trim()) {
      const pattern = new RegExp(search.trim(), 'i');
      query.$or = [{ name: pattern }, { email: pattern }, { customerId: pattern }];
    }

    const [users, accountAgg, txAgg, balanceAgg, customers] = await Promise.all([
      this.userModel.find(query).sort({ createdAt: -1 }).lean().exec(),
      this.accountModel.aggregate([
        {
          $group: {
            _id: '$customerId',
            merchantsVisited: { $addToSet: '$tenantId' },
            activeMemberships: {
              $sum: {
                $cond: [{ $eq: ['$membershipStatus', 'ACTIVE'] }, 1, 0],
              },
            },
          },
        },
      ]).exec(),
      this.transactionModel.aggregate([
        {
          $match: {
            tenantId: { $ne: PlatformAdminService.PLATFORM_TENANT_ID },
            status: TransactionStatus.COMPLETED,
          },
        },
        {
          $group: {
            _id: '$customerId',
            totalTransactions: { $sum: 1 },
            lastSeen: { $max: '$createdAt' },
          },
        },
      ]).exec(),
      this.ledgerModel.aggregate([
        {
          $match: {
            tenantId: { $ne: PlatformAdminService.PLATFORM_TENANT_ID },
          },
        },
        {
          $group: {
            _id: '$customerId',
            totalPoints: { $sum: { $toDouble: '$amount' } },
          },
        },
      ]).exec(),
      this.customerModel.find({ _id: { $in: [] } }).lean().exec(),
    ]);

    const accountMap = new Map(accountAgg.map((row: any) => [row._id, row]));
    const txMap = new Map(txAgg.map((row: any) => [row._id, row]));
    const balanceMap = new Map(balanceAgg.map((row: any) => [row._id, Math.round(row.totalPoints || 0)]));
    const customerMap = new Map(customers.map((row: any) => [row._id, row]));

    return users.map((user: any) => {
      const accountInfo = accountMap.get(user.customerId) || {};
      const txInfo = txMap.get(user.customerId) || {};
      const customer = customerMap.get(user.customerId);

      return {
        id: user.customerId,
        name: user.name || user.email?.split('@')[0] || 'Customer',
        email: user.email,
        phone: null,
        sharkbandId: this.toSharkbandId(user.customerId),
        totalPoints: balanceMap.get(user.customerId) || 0,
        totalTransactions: txInfo.totalTransactions || 0,
        joinedAt: customer?.createdAt || user.createdAt,
        lastSeen: txInfo.lastSeen || customer?.updatedAt || user.updatedAt || user.createdAt,
        isActive: user.isActive !== false && (accountInfo.activeMemberships || 0) > 0,
        merchantsVisited: accountInfo.merchantsVisited || [],
      };
    });
  }

  async getCustomerDetail(customerId: string) {
    const [user, accounts, transactions, balanceAgg] = await Promise.all([
      this.userModel.findOne({ customerId }).lean().exec(),
      this.accountModel.find({ customerId }).lean().exec(),
      this.transactionModel
        .find({
          customerId,
          tenantId: { $ne: PlatformAdminService.PLATFORM_TENANT_ID },
          status: TransactionStatus.COMPLETED,
        })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean()
        .exec(),
      this.ledgerModel.aggregate([
        { $match: { customerId, tenantId: { $ne: PlatformAdminService.PLATFORM_TENANT_ID } } },
        { $group: { _id: '$customerId', totalPoints: { $sum: { $toDouble: '$amount' } } } },
      ]).exec(),
    ]);

    if (!user) return null;

    const tenantIds = [...new Set(accounts.map((account: any) => account.tenantId))];
    const tenants = await this.tenantModel.find({ _id: { $in: tenantIds } }).lean().exec();
    const tenantMap = new Map(tenants.map((tenant: any) => [tenant._id, tenant.name]));

    const totalPoints = Math.round(balanceAgg[0]?.totalPoints || 0);
    const firstTransaction = transactions[0] as any;
    const userRecord = user as any;
    const lastSeen = firstTransaction?.createdAt || userRecord?.updatedAt || userRecord?.createdAt;

    const auditTrail = transactions.map((tx: any) => {
      const metadata = tx.metadata || {};
      const numericPoints = Math.abs(Number(tx.amount));
      return {
        id: tx._id,
        customerId: tx.customerId,
        merchantId: tx.tenantId,
        merchantName: tx.merchantName || tenantMap.get(tx.tenantId) || tx.tenantId,
        type: metadata.isAdjustment
          ? 'adjustment'
          : tx.type === TransactionType.ISSUE
            ? 'earn'
            : 'redeem',
        points: tx.type === TransactionType.ISSUE ? numericPoints : -numericPoints,
        amount:
          tx.type === TransactionType.ISSUE
            ? Number(metadata.purchaseAmount ?? numericPoints)
            : null,
        rewardName: metadata.rewardName || null,
        staffName: metadata.staffName || 'System',
        branchName: metadata.branchName || null,
        timestamp: tx.createdAt,
        isManualAdjustment: metadata.isAdjustment === true,
        adjustmentReason: metadata.adjustmentReason || null,
      };
    });

    return {
      id: customerId,
      name: user.name || user.email?.split('@')[0] || 'Customer',
      email: user.email,
      phone: null,
      sharkbandId: this.toSharkbandId(customerId),
      totalPoints,
      totalTransactions: transactions.length,
      joinedAt: userRecord?.createdAt,
      lastSeen,
      isActive: user.isActive !== false && accounts.some((account: any) => account.membershipStatus === 'ACTIVE'),
      merchantsVisited: tenantIds,
      auditTrail,
    };
  }

  async getLogs() {
    const logs = await this.auditLogModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(250)
      .lean()
      .exec();

    return logs.map((log: any) => ({
      id: log._id,
      timestamp: log.createdAt,
      level: this.mapAuditLogLevel(log.action),
      source: log.resourceType || 'system',
      message: this.humanizeAuditAction(log),
      metadata: log.metadata || {},
    }));
  }

  private buildDailyTrend(start: Date, trendAgg: any[]): DailyPlatformRow[] {
    const trendMap = new Map<
      string,
      {
        earn: number;
        redeem: number;
        earnCustomers: Set<string>;
        redeemCustomers: Set<string>;
        pointsIssued: number;
        pointsRedeemed: number;
      }
    >();

    for (const row of trendAgg) {
      const date = row._id?.date;
      const type = row._id?.type;
      if (!date || !type) continue;
      if (!trendMap.has(date)) {
        trendMap.set(date, {
          earn: 0,
          redeem: 0,
          earnCustomers: new Set<string>(),
          redeemCustomers: new Set<string>(),
          pointsIssued: 0,
          pointsRedeemed: 0,
        });
      }

      const bucket = trendMap.get(date)!;
      const customers = Array.isArray(row.customers) ? row.customers : [];

      if (type === TransactionType.ISSUE) {
        bucket.earn += row.count ?? 0;
        bucket.pointsIssued += Math.round(row.totalAmount ?? 0);
        customers.forEach((customerId: string) => bucket.earnCustomers.add(customerId));
      } else if (type === TransactionType.REDEEM) {
        bucket.redeem += row.count ?? 0;
        bucket.pointsRedeemed += Math.abs(Math.round(row.totalAmount ?? 0));
        customers.forEach((customerId: string) => bucket.redeemCustomers.add(customerId));
      }
    }

    const rows: DailyPlatformRow[] = [];
    for (let offset = 0; offset < 14; offset += 1) {
      const day = this.addDays(start, offset);
      const key = this.toDateKey(day);
      const bucket = trendMap.get(key);
      const uniqueCustomers = bucket
        ? new Set([...bucket.earnCustomers, ...bucket.redeemCustomers]).size
        : 0;

      rows.push({
        date: key,
        earn: bucket?.earn ?? 0,
        redeem: bucket?.redeem ?? 0,
        uniqueCustomers,
        pointsIssued: bucket?.pointsIssued ?? 0,
        pointsRedeemed: bucket?.pointsRedeemed ?? 0,
      });
    }

    return rows;
  }

  private buildCategoryBreakdown(merchants: any[]) {
    const counts = new Map<string, number>();
    merchants.forEach((merchant) => {
      const category = merchant?.config?.category || 'other';
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  private buildForecasts(dailyTrend: DailyPlatformRow[]) {
    const previous = dailyTrend.slice(0, 7);
    const recent = dailyTrend.slice(-7);

    const previousTransactions = previous.reduce((sum, row) => sum + row.earn + row.redeem, 0);
    const recentTransactions = recent.reduce((sum, row) => sum + row.earn + row.redeem, 0);
    const previousPointsIssued = previous.reduce((sum, row) => sum + row.pointsIssued, 0);
    const recentPointsIssued = recent.reduce((sum, row) => sum + row.pointsIssued, 0);
    const previousPointsRedeemed = previous.reduce((sum, row) => sum + row.pointsRedeemed, 0);
    const recentPointsRedeemed = recent.reduce((sum, row) => sum + row.pointsRedeemed, 0);
    const previousUniqueCustomers = previous.reduce((sum, row) => sum + row.uniqueCustomers, 0);
    const recentUniqueCustomers = recent.reduce((sum, row) => sum + row.uniqueCustomers, 0);

    return {
      next7DaysTransactions: this.projectForward(previousTransactions, recentTransactions),
      next7DaysPointsIssued: this.projectForward(previousPointsIssued, recentPointsIssued),
      next7DaysPointsRedeemed: this.projectForward(previousPointsRedeemed, recentPointsRedeemed),
      next7DaysActiveCustomers: this.projectForward(
        previousUniqueCustomers,
        recentUniqueCustomers,
      ),
      transactionTrendPct: this.computeTrendPct(previousTransactions, recentTransactions),
      issuedTrendPct: this.computeTrendPct(previousPointsIssued, recentPointsIssued),
      redeemedTrendPct: this.computeTrendPct(previousPointsRedeemed, recentPointsRedeemed),
      customerTrendPct: this.computeTrendPct(previousUniqueCustomers, recentUniqueCustomers),
    };
  }

  private buildInsightCards(params: {
    dailyTrend: DailyPlatformRow[];
    forecasts: ReturnType<PlatformAdminService['buildForecasts']>;
    failedRedemptions7d: number;
    adjustmentActions7d: number;
    activeMerchants: number;
    totalRegisteredMerchants: number;
  }) {
    const {
      dailyTrend,
      forecasts,
      failedRedemptions7d,
      adjustmentActions7d,
      activeMerchants,
      totalRegisteredMerchants,
    } = params;

    const last7 = dailyTrend.slice(-7);
    const avgDailyTransactions = Math.round(
      last7.reduce((sum, row) => sum + row.earn + row.redeem, 0) / Math.max(last7.length, 1),
    );
    const avgDailyCustomers = Math.round(
      last7.reduce((sum, row) => sum + row.uniqueCustomers, 0) / Math.max(last7.length, 1),
    );
    const merchantActivationPct =
      totalRegisteredMerchants > 0
        ? Math.round((activeMerchants / totalRegisteredMerchants) * 100)
        : 0;

    return [
      {
        id: 'forecast-transactions',
        title: 'Predicted 7-day transaction volume',
        value: forecasts.next7DaysTransactions.toLocaleString(),
        detail: `${this.signedPctLabel(forecasts.transactionTrendPct)} vs previous 7 days`,
        tone: forecasts.transactionTrendPct >= 0 ? 'positive' : 'warning',
      },
      {
        id: 'forecast-customers',
        title: 'Predicted active customers (7 days)',
        value: forecasts.next7DaysActiveCustomers.toLocaleString(),
        detail: `Current 7-day avg: ${avgDailyCustomers.toLocaleString()} daily`,
        tone: forecasts.customerTrendPct >= 0 ? 'positive' : 'neutral',
      },
      {
        id: 'merchant-coverage',
        title: 'Merchant activation health',
        value: `${merchantActivationPct}%`,
        detail: `${activeMerchants}/${totalRegisteredMerchants} merchants currently active`,
        tone: merchantActivationPct >= 80 ? 'positive' : 'warning',
      },
      {
        id: 'operational-risk',
        title: 'Operational intervention signal',
        value: `${failedRedemptions7d + adjustmentActions7d}`,
        detail: `${failedRedemptions7d} failed redemptions + ${adjustmentActions7d} manual adjustments in 7 days`,
        tone:
          failedRedemptions7d + adjustmentActions7d > Math.max(avgDailyTransactions, 1)
            ? 'warning'
            : 'neutral',
      },
    ];
  }

  private humanizeAuditAction(log: any) {
    const action = String(log.action || 'UNKNOWN').replace(/_/g, ' ').toLowerCase();
    const subject = log.resourceType ? ` on ${log.resourceType}` : '';
    return `${action.charAt(0).toUpperCase()}${action.slice(1)}${subject}`;
  }

  private mapAuditLogLevel(action: string): 'info' | 'warn' | 'error' {
    if (action === 'REDEMPTION_FAILED') return 'error';
    if (action.includes('DISABLED') || action.includes('FAILED')) return 'warn';
    return 'info';
  }

  private projectForward(previousPeriod: number, recentPeriod: number) {
    if (recentPeriod === 0 && previousPeriod === 0) return 0;
    if (previousPeriod === 0) return Math.round(recentPeriod);

    const trendRatio = recentPeriod / previousPeriod;
    const boundedTrend = Math.min(1.5, Math.max(0.6, trendRatio));
    return Math.round(recentPeriod * boundedTrend);
  }

  private computeTrendPct(previousPeriod: number, recentPeriod: number) {
    if (previousPeriod === 0) {
      return recentPeriod > 0 ? 100 : 0;
    }

    return Number((((recentPeriod - previousPeriod) / previousPeriod) * 100).toFixed(1));
  }

  private signedPctLabel(value: number) {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  private addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private startOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private toSharkbandId(customerId: string) {
    return `SB-${customerId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  }

  private extractCity(address: string) {
    if (!address) return '';
    const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0] || '';
  }
}
