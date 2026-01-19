import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { LedgerService } from '../ledger/ledger.service';
import { OutboxService } from '../outbox/outbox.service';
import { FraudSignalsService } from '../fraud-signals/fraud-signals.service';
import { PilotMetricsService } from '../pilot-metrics/pilot-metrics.service';
import { getCustomerInfoById } from '../common/customer-data';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: LedgerService,
    private outboxService: OutboxService,
    private fraudSignalsService: FraudSignalsService,
    private pilotMetricsService: PilotMetricsService,
  ) {}

  async issuePoints(
    tenantId: string,
    customerId: string,
    amount: number,
    deviceId: string | null,
    idempotencyKey: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Check idempotency
    const existing = await this.prisma.transaction.findFirst({
      where: {
        tenantId,
        idempotencyKey,
      },
    });

    if (existing) {
      const balance = await this.ledgerService.getBalance(tenantId, customerId);
      return {
        id: existing.id,
        type: existing.type,
        amount: Number(existing.amount),
        status: existing.status,
        balance,
      };
    }

    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    // Validate device if provided
    if (deviceId) {
      const device = await this.prisma.device.findFirst({
        where: {
          id: deviceId,
          tenantId,
          isActive: true,
        },
      });

      if (!device) {
        throw new NotFoundException(`Device ${deviceId} not found or inactive`);
      }
    }

    // Create transaction and ledger entry atomically
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          customerId,
          type: 'ISSUE',
          amount,
          status: 'COMPLETED',
          idempotencyKey,
          deviceId,
        },
      });

      // Append ledger entry (idempotent) - use transaction client
      const ledgerEntry = await this.ledgerService.appendEntry(
        tenantId,
        customerId,
        amount,
        idempotencyKey,
        transaction.id,
        'ISSUE',
        tx, // Pass transaction client
      );

      // Write outbox event (atomic with transaction)
      await this.outboxService.writeEvent(
        tenantId,
        'points.issued',
        {
          transactionId: transaction.id,
          customerId,
          amount,
          balanceAfter: ledgerEntry.balanceAfter,
          deviceId,
          idempotencyKey,
        },
        tx,
      );

      return { transaction, balanceAfter: ledgerEntry.balanceAfter };
    });

    // Track fraud signals
    await this.fraudSignalsService.trackScan(tenantId, deviceId, customerId);

    // Track onboarding milestone (first scan only)
    const funnel = await this.prisma.pilotOnboardingFunnel.findUnique({
      where: { tenantId },
    });
    if (!funnel?.firstScanAt) {
      await this.pilotMetricsService.trackOnboardingMilestone(tenantId, 'first_scan');
    }

    return {
      id: result.transaction.id,
      type: result.transaction.type,
      amount: Number(result.transaction.amount),
      status: result.transaction.status,
      balance: result.balanceAfter,
    };
  }

  async redeemPoints(
    tenantId: string,
    customerId: string,
    rewardId: string,
    idempotencyKey: string,
  ) {
    // Check idempotency
    const existing = await this.prisma.redemption.findFirst({
      where: {
        tenantId,
        idempotencyKey,
      },
    });

    if (existing && existing.status === 'COMPLETED') {
      const balance = await this.ledgerService.getBalance(tenantId, customerId);
      return {
        id: existing.id,
        status: existing.status,
        pointsDeducted: Number(existing.pointsDeducted),
        balance,
      };
    }

    // Get reward
    const reward = await this.prisma.reward.findFirst({
      where: {
        id: rewardId,
        tenantId,
        isActive: true,
      },
    });

    if (!reward) {
      throw new NotFoundException(`Reward ${rewardId} not found`);
    }

    const pointsRequired = Number(reward.pointsRequired);

    // Check balance with lock (SELECT FOR UPDATE)
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const balance = await this.ledgerService.getBalance(tenantId, customerId);

      if (balance < pointsRequired) {
        throw new BadRequestException('Insufficient points');
      }

      // Create redemption record
      const redemption = await tx.redemption.create({
        data: {
          tenantId,
          customerId,
          rewardId,
          pointsDeducted: pointsRequired,
          status: 'COMPLETED',
          idempotencyKey,
          completedAt: new Date(),
        },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          customerId,
          type: 'REDEEM',
          amount: -pointsRequired,
          status: 'COMPLETED',
          idempotencyKey: `${idempotencyKey}-tx`,
        },
      });

      // Append ledger entry (negative amount) - use transaction client
      const ledgerEntry = await this.ledgerService.appendEntry(
        tenantId,
        customerId,
        -pointsRequired,
        idempotencyKey,
        transaction.id,
        'REDEEM',
        tx, // Pass transaction client
      );

      // Write outbox event
      await this.outboxService.writeEvent(
        tenantId,
        'points.redeemed',
        {
          redemptionId: redemption.id,
          transactionId: transaction.id,
          customerId,
          rewardId,
          pointsDeducted: pointsRequired,
          balanceAfter: ledgerEntry.balanceAfter,
          idempotencyKey,
        },
        tx,
      );

      return { redemption, balanceAfter: ledgerEntry.balanceAfter };
    });

    // Track fraud signals
    await this.fraudSignalsService.trackRedemption(tenantId, customerId, true);

    return {
      id: result.redemption.id,
      status: result.redemption.status,
      pointsDeducted: Number(result.redemption.pointsDeducted),
      balance: result.balanceAfter,
    };
  }

  async redeemPointsFailure(tenantId: string, customerId: string) {
    // Track failed redemption
    await this.fraudSignalsService.trackRedemption(tenantId, customerId, false);
  }

  async findAll(
    tenantId: string,
    params?: {
      page?: number;
      limit?: number;
      type?: 'ISSUE' | 'REDEEM';
      customerId?: string;
      staffId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.customerId) {
      where.customerId = params.customerId;
    }

    if (params?.startDate) {
      where.createdAt = { ...where.createdAt, gte: params.startDate };
    }

    if (params?.endDate) {
      const endDate = new Date(params.endDate);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: endDate };
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions.map((tx) => {
        const customerId = tx.customerId;
        // Get customer name from transaction metadata or fallback
        const txMeta = tx.metadata as any;
        const customerName = txMeta?.customerName || getCustomerInfoById(customerId).name;

        return {
          id: tx.id,
          customerId,
          customerName,
          type: tx.type === 'ISSUE' ? 'earn' : 'redeem',
          points: tx.type === 'ISSUE' ? Number(tx.amount) : -Number(tx.amount),
          amount: tx.type === 'ISSUE' ? Number(tx.amount) : undefined,
          staffId: '',
          staffName: 'System',
          timestamp: tx.createdAt,
          status: tx.status.toLowerCase() as 'completed' | 'failed' | 'pending',
        };
      }),
      total,
    };
  }
}
