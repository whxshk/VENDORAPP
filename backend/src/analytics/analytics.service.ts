import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getCustomerInfoById } from '../common/customer-data';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(tenantId: string) {
    // Get active customers (membership status = ACTIVE)
    const activeCustomers = await this.prisma.customerMerchantAccount.count({
      where: { tenantId, membershipStatus: 'ACTIVE' },
    });

    // Get repeat customers (customers with more than 1 transaction)
    const customersWithTransactions = await this.prisma.transaction.groupBy({
      by: ['customerId'],
      where: { tenantId },
      _count: { id: true },
    });

    const repeatCustomers = customersWithTransactions.filter(
      (c) => c._count.id > 1,
    ).length;

    // Get total transactions
    const totalTransactions = await this.prisma.transaction.count({
      where: { tenantId },
    });

    // Calculate redemption rate (redeems / issues)
    const [issueCount, redeemCount] = await Promise.all([
      this.prisma.transaction.count({
        where: { tenantId, type: 'ISSUE' },
      }),
      this.prisma.transaction.count({
        where: { tenantId, type: 'REDEEM' },
      }),
    ]);

    const redemptionRate =
      issueCount > 0 ? Number((redeemCount / issueCount).toFixed(4)) : 0;

    // Get recent activity (last 10 transactions)
    const recentTransactions = await this.prisma.transaction.findMany({
      where: { tenantId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
      },
    });

    // Transform to frontend format
    const recentActivity = recentTransactions.map((tx) => {
      const customerId = tx.customerId;
      // Get customer name from transaction metadata or fallback
      const txMeta = tx.metadata as any;
      const customerName = txMeta?.customerName || getCustomerInfoById(customerId).name;

      return {
        id: tx.id,
        customerId,
        customerName,
        type: tx.type === 'ISSUE' ? 'earn' : 'redeem',
        points:
          tx.type === 'ISSUE'
            ? Number(tx.amount)
            : -Number(tx.amount),
        amount: tx.type === 'ISSUE' ? Number(tx.amount) : undefined,
        staffId: '',
        staffName: 'System',
        timestamp: tx.createdAt,
        status: tx.status.toLowerCase() as 'completed' | 'failed' | 'pending',
      };
    });

    return {
      activeCustomers,
      repeatCustomers,
      totalTransactions,
      redemptionRate,
      recentActivity,
      alerts: [], // Empty alerts for now
    };
  }
}
