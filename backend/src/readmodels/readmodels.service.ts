import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerBalance, CustomerBalanceDocument } from '../database/schemas/CustomerBalance.schema';
import { TransactionSummary, TransactionSummaryDocument } from '../database/schemas/TransactionSummary.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReadmodelsService {
  private readonly logger = new Logger(ReadmodelsService.name);

  constructor(
    @InjectModel(CustomerBalance.name) private balanceModel: Model<CustomerBalanceDocument>,
    @InjectModel(TransactionSummary.name) private summaryModel: Model<TransactionSummaryDocument>,
  ) {}

  /**
   * Update customer balance read model (idempotent)
   */
  async updateCustomerBalance(
    tenantId: string,
    customerId: string,
    balance: number,
    eventId?: string,
  ): Promise<void> {
    try {
      await this.balanceModel.findOneAndUpdate(
        { tenantId, customerId },
        {
          _id: uuidv4(),
          tenantId,
          customerId,
          balance,
          lastUpdatedAt: new Date(),
        },
        { upsert: true, new: true }
      ).exec();
    } catch (error) {
      this.logger.error(`Failed to update customer balance for ${customerId}`, error);
      throw error;
    }
  }

  /**
   * Create transaction summary (idempotent)
   */
  async createTransactionSummary(
    tenantId: string,
    transactionId: string,
    customerId: string,
    amount: number,
    type: 'ISSUE' | 'REDEEM',
    transactionDate: Date,
  ): Promise<void> {
    try {
      await this.summaryModel.findOneAndUpdate(
        { transactionId },
        {
          _id: uuidv4(),
          tenantId,
          transactionId,
          customerId,
          amount,
          type,
          transactionDate,
        },
        { upsert: true, new: true }
      ).exec();
    } catch (error) {
      this.logger.error(`Failed to create transaction summary for ${transactionId}`, error);
      throw error;
    }
  }
}
