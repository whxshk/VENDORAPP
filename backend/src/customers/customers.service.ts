import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import * as crypto from 'crypto';
import { getCustomerInfoById, getCustomerInfo } from '../common/customer-data';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
  ) {}

  async getQrToken(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const rotationInterval = customer.rotationIntervalSec || 30;
    const timestampBucket = Math.floor(Date.now() / 1000 / rotationInterval);
    const token = crypto
      .createHmac('sha256', customer.qrTokenSecret)
      .update(`${customerId}:${timestampBucket}`)
      .digest('hex');

    return {
      qrToken: token,
      expiresAt: new Date((timestampBucket + 1) * rotationInterval * 1000),
      refreshInterval: rotationInterval,
    };
  }

  async findAll(tenantId: string, params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    // Get customer accounts for this tenant
    const where: any = { tenantId };
    if (params?.status) {
      where.membershipStatus = params.status.toUpperCase();
    }

    const [accounts, initialTotal] = await Promise.all([
      this.prisma.customerMerchantAccount.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customerMerchantAccount.count({ where }),
    ]);
    
    let total = initialTotal;

    // Get balances for all customers - calculate from ledger entries (source of truth)
    const customerIds = accounts.map((acc) => acc.customerId);
    const [transactionCounts, lastTransactions] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['customerId'],
        where: {
          tenantId,
          customerId: { in: customerIds },
        },
        _count: { id: true },
      }),
      this.prisma.transaction.findMany({
        where: {
          tenantId,
          customerId: { in: customerIds },
        },
        select: {
          customerId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        distinct: ['customerId'],
      }),
    ]);

    // Calculate balances from ledger entries for each customer
    const balanceMap = new Map<string, number>();
    await Promise.all(
      customerIds.map(async (customerId) => {
        const balance = await this.ledgerService.getBalance(tenantId, customerId);
        balanceMap.set(customerId, balance);
      })
    );
    const visitCountMap = new Map(
      transactionCounts.map((t) => [t.customerId, t._count.id]),
    );
    const lastVisitMap = new Map(
      lastTransactions.map((t) => [t.customerId, t.createdAt]),
    );

    // Get customer metadata from transactions (stored in first transaction)
    const customerTransactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        customerId: { in: customerIds },
      },
      select: {
        customerId: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

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

    // Get short customer IDs FIRST (4-digit format: 0001, 0002, etc.)
    // Map by creation order across all customers in tenant
    const allAccounts = await this.prisma.customerMerchantAccount.findMany({
      where: { tenantId },
      include: { customer: true },
      orderBy: { createdAt: 'asc' },
    });

    const shortIdMap = new Map<string, string>();
    allAccounts.forEach((account, index) => {
      const shortId = String(index + 1).padStart(4, '0');
      shortIdMap.set(account.customer.id, shortId);
    });

    // Get customers ordered by creation date to match seed order
    const customersOrdered = [...accounts].sort(
      (a, b) => a.customer.createdAt.getTime() - b.customer.createdAt.getTime(),
    );

    // Create mapping by creation order index
    const customerInfoByOrder = new Map<string, { name: string; email?: string; phone?: string }>();
    customersOrdered.forEach((account, index) => {
      const customerInfo = getCustomerInfo(index);
      customerInfoByOrder.set(account.customer.id, {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
      });
    });

    // Transform to frontend format with shortId
    let customers = accounts.map((account) => {
      const customerId = account.customer.id;
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
        lastVisit: lastVisitMap.get(customerId) || account.customer.updatedAt,
        status: account.membershipStatus === 'ACTIVE' ? 'active' : 'inactive',
        createdAt: account.customer.createdAt,
        tenantId: account.tenantId,
      };
    });

    // Apply search filter if provided (now shortId is already in the customer object)
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      const searchNum = params.search.trim();
      customers = customers.filter(
        (c) => {
          return (
            c.name.toLowerCase().includes(searchLower) ||
            c.email?.toLowerCase().includes(searchLower) ||
            c.phone?.toLowerCase().includes(searchLower) ||
            c.qrCode.toLowerCase().includes(searchLower) ||
            c.id.toLowerCase().includes(searchLower) ||
            c.shortId.includes(searchNum) ||
            searchNum === c.shortId
          );
        }
      );
      // Update total to reflect filtered results
      total = customers.length;
    }

    return {
      data: customers,
      total,
    };
  }

  async findOne(tenantId: string, customerId: string) {
    // Check if customerId is a short ID (4 digits)
    let actualCustomerId = customerId;
    if (/^\d{4}$/.test(customerId)) {
      // It's a short ID, need to resolve it
      const allAccounts = await this.prisma.customerMerchantAccount.findMany({
        where: { tenantId },
        include: { customer: true },
        orderBy: { createdAt: 'asc' },
      });
      
      const index = parseInt(customerId, 10) - 1;
      if (index >= 0 && index < allAccounts.length) {
        actualCustomerId = allAccounts[index].customer.id;
      } else {
        throw new NotFoundException('Customer not found');
      }
    }

    const account = await this.prisma.customerMerchantAccount.findFirst({
      where: {
        tenantId,
        customerId: actualCustomerId,
      },
      include: {
        customer: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate balance from ledger entries (source of truth)
    const balance = await this.ledgerService.getBalance(tenantId, actualCustomerId);

    // Get transactions for this customer
    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        customerId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get ledger entries for points history
    const ledgerEntries = await this.prisma.loyaltyLedgerEntry.findMany({
      where: {
        tenantId,
        customerId,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Generate points history (last 30 days)
    const pointsHistory = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayEntries = ledgerEntries.filter(
        (entry) =>
          entry.createdAt >= date && entry.createdAt < nextDate,
      );

      const dayBalance =
        dayEntries.length > 0
          ? Number(dayEntries[dayEntries.length - 1].balanceAfter)
          : balance;

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

    // Get short ID
    const allAccounts = await this.prisma.customerMerchantAccount.findMany({
      where: { tenantId },
      include: { customer: true },
      orderBy: { createdAt: 'asc' },
    });
    const shortIdIndex = allAccounts.findIndex(acc => acc.customer.id === actualCustomerId);
    const shortId = shortIdIndex >= 0 ? String(shortIdIndex + 1).padStart(4, '0') : '0000';

      return {
        id: account.customer.id,
        shortId,
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        qrCode: account.customer.id,
        pointsBalance: balance, // Already a number from ledgerService
        totalVisits: transactions.length,
        lastVisit: transactions[0]?.createdAt || account.customer.updatedAt,
        status: account.membershipStatus === 'ACTIVE' ? 'active' : 'inactive',
        createdAt: account.customer.createdAt,
        tenantId: account.tenantId,
        pointsHistory,
        transactions: transactions.map((tx) => {
        const txMeta = tx.metadata as any;
        return {
          id: tx.id,
          customerId: tx.customerId,
          customerName: txMeta?.customerName || customerInfo.name,
          type: tx.type === 'ISSUE' ? 'earn' : 'redeem',
          points: tx.type === 'ISSUE' ? Number(tx.amount) : -Number(tx.amount),
          amount: tx.type === 'ISSUE' ? Number(tx.amount) : undefined,
          staffId: '',
          staffName: 'System',
          timestamp: tx.createdAt,
          status: tx.status.toLowerCase() as 'completed' | 'failed' | 'pending',
        };
      }),
    };
  }
}
