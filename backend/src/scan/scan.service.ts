import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionsService } from '../transactions/transactions.service';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScanService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
    private customersService: CustomersService,
  ) {}

  async simulate(
    tenantId: string,
    customerIdInput: string,
    type: 'earn' | 'redeem',
    amount?: number,
    rewardId?: string,
    idempotencyKey?: string,
  ) {
    try {
      // Validate input
      if (!customerIdInput || !customerIdInput.trim()) {
        return {
          success: false,
          error: 'Customer ID is required',
        };
      }

      // Validate type
      if (type !== 'earn' && type !== 'redeem') {
        return {
          success: false,
          error: 'Transaction type must be "earn" or "redeem"',
        };
      }

      // Resolve customer ID (could be short ID like "0001" or full UUID)
      let actualCustomerId = customerIdInput.trim();

      // Check if it's a 4-digit short ID
      if (/^\d{4}$/.test(actualCustomerId)) {
        // Get all customers ordered by creation date
        const allAccounts = await this.prisma.customerMerchantAccount.findMany({
          where: { tenantId },
          include: { customer: true },
          orderBy: { createdAt: 'asc' },
        });

        const index = parseInt(actualCustomerId, 10) - 1;
        if (index >= 0 && index < allAccounts.length) {
          actualCustomerId = allAccounts[index].customer.id;
        } else {
          return {
            success: false,
            error: `Customer with ID ${customerIdInput} not found`,
          };
        }
      } else {
        // Try to find by UUID
        const account = await this.prisma.customerMerchantAccount.findFirst({
          where: {
            tenantId,
            customerId: actualCustomerId,
          },
        });

        if (!account) {
          return {
            success: false,
            error: `Customer with ID ${customerIdInput} not found`,
          };
        }
      }

      // Get customer details for response - validate customer exists
      let customer;
      try {
        customer = await this.customersService.findOne(tenantId, actualCustomerId);
      } catch (error: any) {
        return {
          success: false,
          error: `Customer with ID ${customerIdInput} not found or not associated with this merchant`,
        };
      }

      if (!customer) {
        return {
          success: false,
          error: `Customer with ID ${customerIdInput} not found`,
        };
      }

      if (type === 'earn') {
        // Convert QAR amount to number if it's a string
        const qarAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
        
        if (!qarAmount || qarAmount <= 0 || isNaN(qarAmount)) {
          return {
            success: false,
            error: 'Purchase amount (QAR) is required and must be greater than 0',
          };
        }

        // Convert QAR to points: 0.5 points per QAR
        const pointsToIssue = Math.floor(qarAmount * 0.5);
        
        if (pointsToIssue <= 0) {
          return {
            success: false,
            error: 'Purchase amount must be at least 2 QAR to earn points',
          };
        }

        const actualIdempotencyKey = idempotencyKey || `scan-earn-${Date.now()}-${actualCustomerId}`;
        const result = await this.transactionsService.issuePoints(
          tenantId,
          actualCustomerId,
          pointsToIssue, // Pass points, not QAR amount
          null, // deviceId
          actualIdempotencyKey,
        );

        // Update transaction metadata to store QAR amount
        await this.prisma.transaction.update({
          where: { id: result.id },
          data: {
            metadata: {
              purchaseAmount: qarAmount,
              pointsEarned: pointsToIssue,
              customerName: customer.name,
              customerEmail: customer.email,
              customerPhone: customer.phone,
            },
          },
        });

        // Get the transaction record with updated metadata
        const transaction = await this.prisma.transaction.findUnique({
          where: { id: result.id },
        });

        // Get updated customer balance
        const updatedCustomer = await this.customersService.findOne(tenantId, actualCustomerId);

        const txMetadata = transaction?.metadata as any || {};

        return {
          success: true,
          transaction: {
            id: transaction?.id || result.id,
            customerId: actualCustomerId,
            customerName: customer.name,
            type: 'earn',
            points: pointsToIssue, // Show points earned, not QAR
            amount: txMetadata.purchaseAmount || qarAmount, // QAR amount for reference
            staffId: '',
            staffName: 'System',
            timestamp: transaction?.createdAt || new Date(),
            status: 'completed',
          },
          customer: {
            ...updatedCustomer,
            pointsBalance: Number(result.balance),
          },
        };
      } else {
        // redeem
        if (!rewardId || !rewardId.trim()) {
          return {
            success: false,
            error: 'Reward ID is required for redeem transactions',
          };
        }

        const actualIdempotencyKey = idempotencyKey || `scan-redeem-${Date.now()}-${actualCustomerId}-${rewardId}`;
        const result = await this.transactionsService.redeemPoints(
          tenantId,
          actualCustomerId,
          rewardId,
          actualIdempotencyKey,
        );

        // Get reward details
        const reward = await this.prisma.reward.findFirst({
          where: { id: rewardId, tenantId },
        });

        // Get the transaction record (the transaction uses idempotencyKey with -tx suffix)
        const transaction = await this.prisma.transaction.findFirst({
          where: {
            tenantId,
            customerId: actualCustomerId,
            idempotencyKey: `${actualIdempotencyKey}-tx`,
          },
          orderBy: { createdAt: 'desc' },
        });

        // Update transaction metadata with customer info
        if (transaction) {
          await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              metadata: {
                ...((transaction.metadata as any) || {}),
                customerName: customer.name,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                rewardName: reward?.name,
              },
            },
          });
        }

        // Get updated customer balance
        const updatedCustomer = await this.customersService.findOne(tenantId, actualCustomerId);

        return {
          success: true,
          transaction: {
            id: transaction?.id || '',
            customerId: actualCustomerId,
            customerName: customer.name,
            type: 'redeem',
            points: -Number(result.pointsDeducted), // Negative for redeem
            rewardId,
            rewardName: reward?.name,
            staffId: '',
            staffName: 'System',
            timestamp: transaction?.createdAt || new Date(),
            status: 'completed',
          },
          customer: {
            ...updatedCustomer,
            pointsBalance: Number(result.balance),
          },
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }
}
