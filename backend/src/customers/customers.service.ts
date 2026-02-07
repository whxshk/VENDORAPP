import { Injectable, NotFoundException } from '@nestjs/common';
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
} from '../database/schemas/Transaction.schema';
import {
  LoyaltyLedgerEntry,
  LoyaltyLedgerEntryDocument,
} from '../database/schemas/LoyaltyLedgerEntry.schema';
import { LedgerService } from '../ledger/ledger.service';
import { buildQrPayload } from '../common/qr-payload';
import { getCustomerInfoById, getCustomerInfo } from '../common/customer-data';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerMerchantAccount.name)
    private accountModel: Model<CustomerMerchantAccountDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(LoyaltyLedgerEntry.name) private ledgerModel: Model<LoyaltyLedgerEntryDocument>,
    private ledgerService: LedgerService,
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

    // Get all customer IDs for fetching names from transactions
    const customerIdsForSearch = allUniqueAccounts.map((acc: any) => acc.customerId);

    // Fetch customer names from transaction metadata (the actual displayed names)
    const allTransactions = await this.transactionModel
      .find({ tenantId, customerId: { $in: customerIdsForSearch } })
      .sort({ createdAt: 1 })
      .select('customerId metadata')
      .exec();

    // Build name map from transaction metadata (first transaction's name for each customer)
    const customerNameMap = new Map<string, string>();
    allTransactions.forEach((tx) => {
      const meta = tx.metadata as any;
      if (meta?.customerName && !customerNameMap.has(tx.customerId)) {
        customerNameMap.set(tx.customerId, meta.customerName);
      }
    });

    // Pre-build customer info map for search filtering
    const customerInfoForSearch = new Map<string, { name: string; shortId: string }>();
    allUniqueAccounts.forEach((acc: any, index: number) => {
      const shortId = String(index + 1).padStart(4, '0');
      // Use name from transaction metadata (displayed name) or fallback to index-based
      const name = customerNameMap.get(acc.customerId) || getCustomerInfo(index).name;
      customerInfoForSearch.set(acc.customerId, {
        name,
        shortId,
      });
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

    // Build customer info map from transaction metadata
    const customerInfoMap = new Map<string, { name: string; email?: string; phone?: string }>();
    customerTransactions.forEach((tx) => {
      const meta = tx.metadata as any;
      if (meta?.customerName && !customerInfoMap.has(tx.customerId)) {
        customerInfoMap.set(tx.customerId, {
          name: meta.customerName,
          email: meta.customerEmail,
          phone: meta.customerPhone,
        });
      }
    });

    // Get customers for ALL accounts (for customer info lookup)
    const allCustomerIds = allUniqueAccounts.map((acc: any) => acc.customerId);
    const allCustomers = await this.customerModel.find({ _id: { $in: allCustomerIds } }).exec();
    const customerMap = new Map(allCustomers.map((c) => [c._id, c]));

    // Create mapping by global index for customer names (based on shortId order)
    const customerInfoByOrder = new Map<string, { name: string; email?: string; phone?: string }>();
    allUniqueAccounts.forEach((acc: any, index: number) => {
      const customerInfo = getCustomerInfo(index);
      customerInfoByOrder.set(acc.customerId, {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
      });
    });

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
      // Priority: transaction metadata > creation order > hash fallback
      const info =
        customerInfoMap.get(customerId) ||
        customerInfoByOrder.get(customerId) ||
        getCustomerInfoById(customerId);

      return {
        id: customerId,
        shortId: shortIdMap.get(customerId) || '0000',
        name: info.name,
        email: info.email,
        phone: info.phone,
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

    return {
      data: customers,
      total,
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

    // Get customer info from transaction metadata or fallback
    let customerInfo = getCustomerInfoById(actualCustomerId);
    if (transactions.length > 0) {
      const firstTxMeta = transactions[0].metadata as any;
      if (firstTxMeta?.customerName) {
        customerInfo = {
          name: firstTxMeta.customerName,
          email: firstTxMeta.customerEmail || customerInfo.email,
          phone: firstTxMeta.customerPhone || customerInfo.phone,
          joinDate: customerInfo.joinDate,
          preferredLocation: customerInfo.preferredLocation,
          notes: customerInfo.notes,
        };
      }
    }

    // Get short ID from the already-fetched aggregation
    const shortIdIndex = allUniqueAccounts.findIndex(
      (acc: any) => acc.customerId === actualCustomerId,
    );
    const shortId = shortIdIndex >= 0 ? String(shortIdIndex + 1).padStart(4, '0') : '0000';

    return {
      id: customer._id,
      shortId,
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      qrCode: customer._id,
      pointsBalance: balance,
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
          staffId: '',
          staffName: 'System',
          timestamp: (tx as any).createdAt || new Date(),
          status: tx.status.toLowerCase() as 'completed' | 'failed' | 'pending',
        };
      }),
    };
  }
}
