import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { LoyaltyLedgerEntry, LoyaltyLedgerEntryDocument } from '../database/schemas/LoyaltyLedgerEntry.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LedgerService {
  constructor(
    @InjectModel(LoyaltyLedgerEntry.name) 
    private ledgerModel: Model<LoyaltyLedgerEntryDocument>,
  ) {}

  /**
   * Append entry to ledger (idempotent)
   * Calculates balance_after from previous entries
   * @param session - Optional MongoDB session for transactions
   */
  async appendEntry(
    tenantId: string,
    customerId: string,
    amount: number,
    idempotencyKey: string,
    transactionId: string,
    operationType: string = 'TRANSACTION',
    session?: ClientSession,
  ): Promise<{ id: string; balanceAfter: number }> {
    // Check idempotency
    const existing = await this.ledgerModel
      .findOne({
        tenantId,
        idempotencyKey,
        operationType,
      })
      .session(session || null)
      .exec();

    if (existing) {
      return {
        id: existing._id,
        balanceAfter: Number(existing.balanceAfter),
      };
    }

    // Calculate current balance from all previous entries
    const previousEntries = await this.ledgerModel
      .find({
        tenantId,
        customerId,
      })
      .sort({ createdAt: 1 })
      .session(session || null)
      .exec();

    const currentBalance = previousEntries.reduce(
      (sum: number, entry: LoyaltyLedgerEntryDocument) => sum + Number(entry.amount),
      0,
    );

    const newBalance = currentBalance + amount;

    // Insert ledger entry
    try {
      const entry = new this.ledgerModel({
        _id: uuidv4(),
        tenantId,
        customerId,
        transactionId,
        amount: amount,
        balanceAfter: newBalance,
        idempotencyKey,
        operationType,
      });

      await entry.save({ session });

      return {
        id: entry._id,
        balanceAfter: Number(entry.balanceAfter),
      };
    } catch (error: any) {
      // Handle unique constraint violation (idempotency race condition)
      if (error.code === 11000) {
        const existing = await this.ledgerModel
          .findOne({
            tenantId,
            idempotencyKey,
            operationType,
          })
          .session(session || null)
          .exec();

        if (existing) {
          return {
            id: existing._id,
            balanceAfter: Number(existing.balanceAfter),
          };
        }
      }
      throw error;
    }
  }

  /**
   * Get customer balance (derived from ledger entries)
   */
  async getBalance(tenantId: string, customerId: string): Promise<number> {
    const result = await this.ledgerModel.aggregate([
      {
        $match: {
          tenantId,
          customerId,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: '$amount' } },
        },
      },
    ]).exec();

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Get ledger history with pagination
   */
  async getLedgerHistory(
    tenantId: string,
    customerId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      this.ledgerModel
        .find({
          tenantId,
          customerId,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ledgerModel.countDocuments({
        tenantId,
        customerId,
      }).exec(),
    ]);

    return {
      entries: entries.map((entry: LoyaltyLedgerEntryDocument) => ({
        id: entry._id,
        transactionId: entry.transactionId,
        amount: Number(entry.amount),
        balanceAfter: Number(entry.balanceAfter),
        operationType: entry.operationType,
        createdAt: (entry as any).createdAt || new Date(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
