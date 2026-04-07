import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../database/schemas/Customer.schema';
import {
  CustomerMerchantAccount,
  CustomerMerchantAccountDocument,
} from '../database/schemas/CustomerMerchantAccount.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
  TransactionStatus,
} from '../database/schemas/Transaction.schema';
import {
  LoyaltyLedgerEntry,
  LoyaltyLedgerEntryDocument,
} from '../database/schemas/LoyaltyLedgerEntry.schema';
import { User, UserDocument } from '../database/schemas/User.schema';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { Reward, RewardDocument } from '../database/schemas/Reward.schema';
import {
  Redemption,
  RedemptionDocument,
  RedemptionStatus,
} from '../database/schemas/Redemption.schema';
import { LedgerService } from '../ledger/ledger.service';
import { RulesetsService } from '../rulesets/rulesets.service';
import { buildQrPayload } from '../common/qr-payload';
import { getCustomerInfoById, getCustomerInfo } from '../common/customer-data';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerMerchantAccount.name)
    private accountModel: Model<CustomerMerchantAccountDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(LoyaltyLedgerEntry.name) private ledgerModel: Model<LoyaltyLedgerEntryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    @InjectModel(Redemption.name) private redemptionModel: Model<RedemptionDocument>,
    private ledgerService: LedgerService,
    private rulesetsService: RulesetsService,
  ) {}

  async getQrToken(customerId: string): Promise<{
    qrPayload: string;
    expiresAt: number;
    refreshIntervalSec: number;
  }> {
    const customer = await this.customerModel.findById(customerId).exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const rotationIntervalSec = customer.rotationIntervalSec ?? 120;
    const out = buildQrPayload(customerId, customer.qrTokenSecret, rotationIntervalSec);
    return {
      qrPayload: out.qrToken,
      expiresAt: out.expiresAt,
      refreshIntervalSec: out.refreshIntervalSec,
    };
  }

  async findAll(
    tenantId: string,
    params?: { page?: number; limit?: number; search?: string; status?: string },
  ) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    // SINGLE aggregation for all unique customers in tenant (used for shortId assignment)
    // Uses stable sort: createdAt ASC, then _id ASC as tiebreaker for identical timestamps
    const allUniqueAccounts = await this.accountModel
      .aggregate([
        { $match: { tenantId } },
        { $sort: { createdAt: 1, _id: 1 } }, // Stable sort with _id as tiebreaker
        {
          $group: {
            _id: '$customerId',
            accountId: { $first: '$_id' },
            customerId: { $first: '$customerId' },
            tenantId: { $first: '$tenantId' },
            membershipStatus: { $first: '$membershipStatus' },
            createdAt: { $first: '$createdAt' },
          },
        },
        { $sort: { createdAt: 1, _id: 1 } }, // Stable sort after grouping
      ])
      .exec();

    // Build shortId map from ALL unique customers (sequential 0001, 0002, etc.)
    const shortIdMap = new Map<string, string>();
    allUniqueAccounts.forEach((account: any, index: number) => {
      const shortId = String(index + 1).padStart(4, '0');
      shortIdMap.set(account.customerId, shortId);
    });

    // Get all customer IDs for user lookup
    const customerIdsForSearch = allUniqueAccounts.map((acc: any) => acc.customerId);

    // Look up real names/emails from User documents (source of truth)
    const usersForSearch = await this.userModel
      .find({ customerId: { $in: customerIdsForSearch } })
      .select('customerId name email')
      .exec();
    const userInfoMap = new Map<string, { name: string; email: string }>();
    usersForSearch.forEach((u) => {
      if (u.customerId) userInfoMap.set(u.customerId, { name: u.name || '', email: u.email });
    });

    // Pre-build customer info map for search filtering (use real User names)
    const customerInfoForSearch = new Map<string, { name: string; shortId: string }>();
    allUniqueAccounts.forEach((acc: any, index: number) => {
      const shortId = String(index + 1).padStart(4, '0');
      const name = userInfoMap.get(acc.customerId)?.name || getCustomerInfo(index).name;
      customerInfoForSearch.set(acc.customerId, { name, shortId });
    });

    // Apply filters (status and search)
    let filteredAccounts = allUniqueAccounts;

    // Apply status filter
    if (params?.status) {
      const statusUpper = params.status.toUpperCase();
      filteredAccounts = filteredAccounts.filter(
        (acc: any) => acc.membershipStatus === statusUpper,
      );
    }

    // Apply search filter - search by name or shortId
    if (params?.search) {
      const searchLower = params.search.toLowerCase().trim();
      filteredAccounts = filteredAccounts.filter((acc: any) => {
        const info = customerInfoForSearch.get(acc.customerId);
        if (!info) return false;

        // Match by name (partial match)
        const nameMatch = info.name.toLowerCase().includes(searchLower);

        // Match by shortId (exact or partial match, e.g., "0001" or "1")
        const shortIdMatch =
          info.shortId.includes(searchLower) || info.shortId === searchLower.padStart(4, '0');

        return nameMatch || shortIdMatch;
      });
    }

    // Get total and paginate from filtered results
    const initialTotal = filteredAccounts.length;
    const paginatedAccounts = filteredAccounts.slice(skip, skip + limit);

    // Transform aggregation results back to account-like objects
    const accounts = paginatedAccounts.map((acc: any) => ({
      _id: acc.accountId,
      customerId: acc.customerId,
      tenantId: acc.tenantId,
      membershipStatus: acc.membershipStatus,
      createdAt: acc.createdAt,
    }));

    let total = initialTotal;

    // Get balances for all customers - calculate from ledger entries (source of truth)
    const customerIds = accounts.map((acc) => acc.customerId);

    // Get transaction counts
    const transactionCounts = await this.transactionModel
      .aggregate([
        { $match: { tenantId, customerId: { $in: customerIds } } },
        {
          $group: {
            _id: '$customerId',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    // Get last transactions
    const lastTransactions = await this.transactionModel
      .find({ tenantId, customerId: { $in: customerIds } })
      .sort({ createdAt: -1 })
      .exec();

    // Group by customerId and get first (most recent) for each
    const lastVisitMap = new Map<string, Date>();
    const seen = new Set<string>();
    lastTransactions.forEach((tx) => {
      if (!seen.has(tx.customerId)) {
        lastVisitMap.set(tx.customerId, (tx as any).createdAt || new Date());
        seen.add(tx.customerId);
      }
    });

    // Calculate balances from ledger entries for each customer
    const balanceMap = new Map<string, number>();
    await Promise.all(
      customerIds.map(async (customerId) => {
        const balance = await this.ledgerService.getBalance(tenantId, customerId);
        balanceMap.set(customerId, balance);
      }),
    );
    const visitCountMap = new Map(transactionCounts.map((t) => [t._id, t.count]));

    // Get customer metadata from transactions (stored in first transaction)
    const customerTransactions = await this.transactionModel
      .find({
        tenantId,
        customerId: { $in: customerIds },
      })
      .sort({ createdAt: 1 })
      .exec();

    // userInfoMap already built above for search — reuse it here for display names

    // Get customers for current accounts
    const currentCustomerIds = accounts.map((acc) => acc.customerId);
    const currentCustomers = await this.customerModel
      .find({ _id: { $in: currentCustomerIds } })
      .exec();
    const currentCustomerMap = new Map(currentCustomers.map((c) => [c._id, c]));

    // Transform to frontend format with shortId
    let customers = accounts.map((account) => {
      const customerId = account.customerId;
      const customer = currentCustomerMap.get(customerId as any);
      const userInfo = userInfoMap.get(customerId);
      const fallbackInfo = getCustomerInfoById(customerId);

      return {
        id: customerId,
        shortId: shortIdMap.get(customerId) || '0000',
        name: userInfo?.name || fallbackInfo.name,
        email: userInfo?.email || fallbackInfo.email,
        phone: fallbackInfo.phone,
        qrCode: customerId, // Use customer ID as QR code identifier
        pointsBalance: balanceMap.get(customerId) || 0,
        totalVisits: visitCountMap.get(customerId) || 0,
        lastVisit: lastVisitMap.get(customerId) || (customer as any)?.updatedAt || new Date(),
        status: account.membershipStatus === 'ACTIVE' ? 'active' : 'inactive',
        createdAt: (customer as any)?.createdAt || new Date(),
        tenantId: account.tenantId,
      };
    });

    // Apply search filter if provided (now shortId is already in the customer object)
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      const searchNum = params.search.trim();
      customers = customers.filter((c) => {
        return (
          c.name.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phone?.toLowerCase().includes(searchLower) ||
          c.qrCode.toLowerCase().includes(searchLower) ||
          c.id.toLowerCase().includes(searchLower) ||
          c.shortId.includes(searchNum) ||
          searchNum === c.shortId
        );
      });
      // Update total to reflect filtered results
      total = customers.length;
    }

    const loyaltyInfo = await this.getLoyaltyInfo(tenantId);
    return {
      data: customers,
      total,
      loyaltyType: loyaltyInfo.loyaltyType,
      stampsRequired: loyaltyInfo.stampsRequired,
    };
  }

  async findOne(tenantId: string, customerId: string) {
    // Use aggregation with stable sort for consistent shortId resolution
    const allUniqueAccounts = await this.accountModel
      .aggregate([
        { $match: { tenantId } },
        { $sort: { createdAt: 1, _id: 1 } },
        {
          $group: {
            _id: '$customerId',
            accountId: { $first: '$_id' },
            customerId: { $first: '$customerId' },
            createdAt: { $first: '$createdAt' },
          },
        },
        { $sort: { createdAt: 1, _id: 1 } },
      ])
      .exec();

    // Check if customerId is a short ID (4 digits)
    let actualCustomerId = customerId;
    if (/^\d{4}$/.test(customerId)) {
      // It's a short ID, need to resolve it
      const index = parseInt(customerId, 10) - 1;
      if (index >= 0 && index < allUniqueAccounts.length) {
        actualCustomerId = allUniqueAccounts[index].customerId;
      } else {
        throw new NotFoundException('Customer not found');
      }
    }

    const account = await this.accountModel
      .findOne({
        tenantId,
        customerId: actualCustomerId,
      })
      .exec();

    if (!account) {
      throw new NotFoundException('Customer not found');
    }

    const customer = await this.customerModel.findById(actualCustomerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate balance from ledger entries (source of truth)
    const balance = await this.ledgerService.getBalance(tenantId, actualCustomerId);

    // Get transactions for this customer
    const transactions = await this.transactionModel
      .find({
        tenantId,
        customerId: actualCustomerId,
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    // Get ledger entries for points history
    const ledgerEntries = await this.ledgerModel
      .find({
        tenantId,
        customerId: actualCustomerId,
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .exec();

    // Generate points history (last 30 days)
    const pointsHistory = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayEntries = ledgerEntries.filter((entry) => {
        const createdAt = (entry as any).createdAt;
        return createdAt && createdAt >= date && createdAt < nextDate;
      });

      const dayBalance =
        dayEntries.length > 0 ? Number(dayEntries[dayEntries.length - 1].balanceAfter) : balance;

      pointsHistory.push({
        date: date.toISOString(),
        points: dayEntries.reduce((sum, e) => sum + Number(e.amount), 0),
        balance: dayBalance,
      });
    }

    // Get customer info: User document is the source of truth for name/email
    const customerUser = await this.userModel
      .findOne({ customerId: actualCustomerId })
      .select('name email')
      .exec();

    const fallback = getCustomerInfoById(actualCustomerId);
    const customerInfo = {
      name: customerUser?.name || fallback.name,
      email: customerUser?.email || fallback.email,
      phone: fallback.phone,
      joinDate: fallback.joinDate,
      preferredLocation: fallback.preferredLocation,
      notes: fallback.notes,
    };

    // Get short ID from the already-fetched aggregation
    const shortIdIndex = allUniqueAccounts.findIndex(
      (acc: any) => acc.customerId === actualCustomerId,
    );
    const shortId = shortIdIndex >= 0 ? String(shortIdIndex + 1).padStart(4, '0') : '0000';

    const loyaltyInfo = await this.getLoyaltyInfo(tenantId);

    return {
      id: customer._id,
      shortId,
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      qrCode: customer._id,
      pointsBalance: balance,
      loyaltyType: loyaltyInfo.loyaltyType,
      stampsRequired: loyaltyInfo.stampsRequired,
      totalVisits: transactions.length,
      lastVisit:
        (transactions[0] as any)?.createdAt ||
        (customer as any).updatedAt ||
        (customer as any).createdAt ||
        new Date(),
      status: account.membershipStatus === 'ACTIVE' ? 'active' : 'inactive',
      createdAt: (customer as any).createdAt || new Date(),
      tenantId: account.tenantId,
      pointsHistory,
      transactions: transactions.map((tx) => {
        const txMeta = tx.metadata as any;
        const numericPoints = Math.abs(Number(tx.amount));
        const parsedPurchaseAmount =
          txMeta?.purchaseAmount === undefined || txMeta?.purchaseAmount === null
            ? undefined
            : Number(txMeta.purchaseAmount);
        const issueAmount =
          parsedPurchaseAmount !== undefined && Number.isFinite(parsedPurchaseAmount)
            ? parsedPurchaseAmount
            : numericPoints;

        return {
          id: tx._id,
          customerId: tx.customerId,
          customerName: txMeta?.customerName || customerInfo.name,
          type: tx.type === TransactionType.ISSUE ? 'earn' : 'redeem',
          points: tx.type === TransactionType.ISSUE ? numericPoints : -numericPoints,
          amount: tx.type === TransactionType.ISSUE ? issueAmount : undefined,
          stampIssued: txMeta?.stampIssued === true,
          isAdjustment: txMeta?.isAdjustment === true,
          adjustmentReason: txMeta?.adjustmentReason,
          staffId: '',
          staffName: 'System',
          timestamp: (tx as any).createdAt || new Date(),
          status: tx.status.toLowerCase() as 'completed' | 'failed' | 'pending',
        };
      }),
    };
  }

  private async getLoyaltyInfo(tenantId: string): Promise<{ loyaltyType: string; stampsRequired: number }> {
    const tenant = await this.tenantModel.findById(tenantId).select('config').exec();
    const config = (tenant?.config as Record<string, any>) || {};
    let loyaltyType: string = config['loyalty_type'] || '';
    let stampsRequired: number = config['stamps_required'] ? Number(config['stamps_required']) : 0;
    if (!loyaltyType) {
      const resolved = await this.rulesetsService.getLoyaltyType(tenantId);
      loyaltyType = resolved.loyaltyType;
      if (!stampsRequired) stampsRequired = resolved.stampsRequired;
    }
    if (!loyaltyType) loyaltyType = 'points';
    if (!stampsRequired) stampsRequired = 10;
    return { loyaltyType, stampsRequired };
  }

  async adjustBalance(
    tenantId: string,
    customerId: string,
    staffId: string,
    delta: number,
    reason: string,
  ) {
    if (delta === 0) throw new BadRequestException('Delta must be non-zero');

    // Resolve short ID (4-digit)
    let actualCustomerId = customerId;
    if (/^\d{4}$/.test(customerId)) {
      const allAccounts = await this.accountModel
        .aggregate([
          { $match: { tenantId } },
          { $sort: { createdAt: 1, _id: 1 } },
          { $group: { _id: '$customerId', customerId: { $first: '$customerId' }, createdAt: { $first: '$createdAt' } } },
          { $sort: { createdAt: 1, _id: 1 } },
        ])
        .exec();
      const index = parseInt(customerId, 10) - 1;
      if (index >= 0 && index < allAccounts.length) {
        actualCustomerId = allAccounts[index].customerId;
      } else {
        throw new NotFoundException('Customer not found');
      }
    }

    const account = await this.accountModel.findOne({ tenantId, customerId: actualCustomerId }).exec();
    if (!account) throw new NotFoundException('Customer not found');

    if (delta < 0) {
      const currentBalance = await this.ledgerService.getBalance(tenantId, actualCustomerId);
      if (currentBalance + delta < 0) {
        throw new BadRequestException(`Cannot reduce balance below zero (current: ${currentBalance})`);
      }
    }

    const idempotencyKey = uuidv4();
    const txType = delta > 0 ? TransactionType.ISSUE : TransactionType.REDEEM;

    const transaction = new this.transactionModel({
      _id: uuidv4(),
      tenantId,
      customerId: actualCustomerId,
      type: txType,
      amount: delta,
      status: TransactionStatus.COMPLETED,
      idempotencyKey,
      metadata: {
        isAdjustment: true,
        adjustmentReason: reason,
        adjustedByStaffId: staffId,
      },
    });
    await transaction.save();

    const ledgerEntry = await this.ledgerService.appendEntry(
      tenantId,
      actualCustomerId,
      delta,
      idempotencyKey,
      transaction._id,
      'ADJUSTMENT',
    );

    return {
      transactionId: transaction._id,
      customerId: actualCustomerId,
      delta,
      newBalance: ledgerEntry.balanceAfter,
      reason,
    };
  }

  /**
   * GET /customers/me — Customer-facing profile endpoint.
   * Returns the authenticated user's basic info and linked customerId.
   */
  async getCustomerProfile(userId: string, tenantId: string) {
    const user = await this.userModel
      .findOne({ _id: userId, tenantId })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      userId: user._id,
      email: user.email,
      full_name: user.name || null,
      customerId: user.customerId || null,
      created_date: (user as any).createdAt || null,
    };
  }

  /**
   * GET /customers/me/memberships — Customer-facing memberships endpoint.
   * Returns all CustomerMerchantAccounts for the linked customerId,
   * enriched with tenant (merchant) data and current ledger balance.
   */
  async getCustomerMemberships(userId: string, tenantId: string) {
    const user = await this.userModel
      .findOne({ _id: userId, tenantId })
      .select('customerId')
      .exec();

    if (!user?.customerId) {
      return [];
    }

    const customerId = user.customerId;
    const accounts = await this.accountModel.find({ customerId }).exec();

    if (accounts.length === 0) return [];

    const tenantIds = accounts.map((a) => a.tenantId);
    const tenants = await this.tenantModel
      .find({ _id: { $in: tenantIds } })
      .exec();
    const tenantMap = new Map(tenants.map((t) => [t._id as string, t]));

    // Skip accounts whose merchant has been deleted from the database
    const activeAccounts = accounts.filter((a) => tenantMap.has(a.tenantId));

    const results = await Promise.all(
      activeAccounts.map(async (account) => {
        const tenant = tenantMap.get(account.tenantId);
        const config = (tenant?.config as Record<string, any>) || {};
        const balance = await this.ledgerService.getBalance(account.tenantId, customerId);

        const txCount = await this.transactionModel.countDocuments({
          tenantId: account.tenantId,
          customerId,
        });

        // Prefer explicit config value; fall back to active Ruleset document; then to stamp rewards
        let loyaltyType: string = config['loyalty_type'] || '';
        let stampsRequired: number = config['stamps_required'] ? Number(config['stamps_required']) : 0;
        if (!loyaltyType) {
          const resolved = await this.rulesetsService.getLoyaltyType(account.tenantId);
          loyaltyType = resolved.loyaltyType;
          if (!stampsRequired) stampsRequired = resolved.stampsRequired;
        }
        // Final fallback: if any active stamp reward exists, treat as stamps merchant
        if (loyaltyType !== 'stamps') {
          const stampReward = await this.rewardModel
            .findOne({ tenantId: account.tenantId, rewardType: 'stamps', isActive: true })
            .exec();
          if (stampReward) {
            loyaltyType = 'stamps';
            if (!stampsRequired) stampsRequired = (stampReward as any).stampsCost ?? 10;
          }
        }
        if (!stampsRequired) stampsRequired = 10;

        // Compute stamps and points SEPARATELY from transaction metadata.
        // This ensures that GIVE_POINTS transactions on a stamps-configured merchant
        // are shown as points (not stamps) in the customer app.
        const stampIssuedAgg = await this.transactionModel.aggregate([
          {
            $match: {
              tenantId: account.tenantId,
              customerId,
              type: TransactionType.ISSUE,
              'metadata.stampIssued': true,
            },
          },
          { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } },
        ]).exec();
        const stampsIssued = Math.round(stampIssuedAgg[0]?.total ?? 0);

        // Find stamp reward IDs for this tenant
        const stampRewards = await this.rewardModel
          .find({ tenantId: account.tenantId, rewardType: 'stamps' })
          .select('_id')
          .exec();
        const stampRewardIdList = stampRewards.map((r) => r._id as string);

        // Sum stamp redemptions via the Redemption collection
        let stampsRedeemed = 0;
        if (stampRewardIdList.length > 0) {
          const stampRedemptionAgg = await this.redemptionModel.aggregate([
            {
              $match: {
                tenantId: account.tenantId,
                customerId,
                rewardId: { $in: stampRewardIdList },
                status: RedemptionStatus.COMPLETED,
              },
            },
            { $group: { _id: null, total: { $sum: { $toDouble: '$pointsDeducted' } } } },
          ]).exec();
          stampsRedeemed = Math.round(stampRedemptionAgg[0]?.total ?? 0);
        }

        const stamps_count = Math.max(0, stampsIssued - stampsRedeemed);
        const points_balance = Math.max(0, balance - stamps_count);

        return {
          id: account._id,
          merchant_id: account.tenantId,
          merchant_name: tenant?.name || 'Unknown',
          merchant_category: config['category'] || null,
          merchant_logo_url: config['logo_url'] || null,
          loyalty_type: loyaltyType,
          points_balance,
          stamps_count,
          stamps_required: stampsRequired,
          total_visits: txCount,
          membership_status: account.membershipStatus,
        };
      }),
    );

    return results;
  }

  /**
   * DELETE /customers/me — Delete all data for the authenticated customer.
   */
  async deleteCustomerAccount(userId: string, tenantId: string): Promise<void> {
    const user = await this.userModel.findOne({ _id: userId, tenantId }).exec();
    if (!user) return;

    const customerId = user.customerId;

    if (customerId) {
      // Delete ledger entries, transactions, and merchant accounts for this customer
      await this.ledgerModel.deleteMany({ customerId }).exec();
      await this.transactionModel.deleteMany({ customerId }).exec();
      await this.accountModel.deleteMany({ customerId }).exec();
      await this.customerModel.deleteOne({ _id: customerId }).exec();
    }

    // Delete the user account itself
    await this.userModel.deleteOne({ _id: userId }).exec();
  }
}
