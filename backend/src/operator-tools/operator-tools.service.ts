import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { User, UserDocument } from '../database/schemas/User.schema';
import { CustomerMerchantAccount, CustomerMerchantAccountDocument } from '../database/schemas/CustomerMerchantAccount.schema';
import { Transaction, TransactionDocument, TransactionType, TransactionStatus } from '../database/schemas/Transaction.schema';
import { LedgerService } from '../ledger/ledger.service';
import { OutboxService } from '../outbox/outbox.service';
import { AuditService } from '../audit/audit.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OperatorToolsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CustomerMerchantAccount.name) private accountModel: Model<CustomerMerchantAccountDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectConnection() private connection: Connection,
    private ledgerService: LedgerService,
    private outboxService: OutboxService,
    private auditService: AuditService,
  ) {}

  async disableTenant(tenantId: string, id: string) {
    if (id !== tenantId) throw new ForbiddenException('Can only disable own tenant');
    const t = await this.tenantModel.findOne({ _id: id }).exec();
    if (!t) throw new NotFoundException('Tenant not found');
    await this.tenantModel.updateOne({ _id: id }, { isActive: false }).exec();
    return { id, isActive: false };
  }

  async enableTenant(tenantId: string, id: string) {
    if (id !== tenantId) throw new ForbiddenException('Can only enable own tenant');
    const t = await this.tenantModel.findOne({ _id: id }).exec();
    if (!t) throw new NotFoundException('Tenant not found');
    await this.tenantModel.updateOne({ _id: id }, { isActive: true }).exec();
    return { id, isActive: true };
  }

  async disableUser(tenantId: string, userId: string, operatorId: string) {
    const u = await this.userModel.findOne({ _id: userId, tenantId }).exec();
    if (!u) throw new NotFoundException('User not found');
    await this.userModel.updateOne({ _id: userId }, { isActive: false }).exec();
    await this.auditService.log(tenantId, operatorId, 'USER_DISABLED', 'user', userId, {});
    return { id: userId, isActive: false };
  }

  async enableUser(tenantId: string, userId: string, operatorId: string) {
    const u = await this.userModel.findOne({ _id: userId, tenantId }).exec();
    if (!u) throw new NotFoundException('User not found');
    await this.userModel.updateOne({ _id: userId }, { isActive: true }).exec();
    await this.auditService.log(tenantId, operatorId, 'USER_ENABLED', 'user', userId, {});
    return { id: userId, isActive: true };
  }

  async disableCustomer(tenantId: string, customerId: string) {
    const acc = await this.accountModel.findOne({ customerId, tenantId }).exec();
    if (!acc) throw new NotFoundException('Customer not found');
    await this.accountModel.updateMany({ customerId, tenantId }, { membershipStatus: 'DISABLED' }).exec();
    return { customerId, membershipStatus: 'DISABLED' };
  }

  async enableCustomer(tenantId: string, customerId: string) {
    const acc = await this.accountModel.findOne({ customerId, tenantId }).exec();
    if (!acc) throw new NotFoundException('Customer not found');
    await this.accountModel.updateMany({ customerId, tenantId }, { membershipStatus: 'ACTIVE' }).exec();
    return { customerId, membershipStatus: 'ACTIVE' };
  }

  /**
   * Manual adjustment (credit/debit)
   * Only for merchant admins
   */
  async manualAdjustment(
    tenantId: string,
    customerId: string,
    amount: number,
    reason: string,
    userId: string,
    idempotencyKey: string,
  ) {
    // Validate customer belongs to tenant
    const account = await this.accountModel.findOne({
      tenantId,
      customerId,
    }).exec();

    if (!account) {
      throw new NotFoundException(`Customer ${customerId} not found for this tenant`);
    }

    // Create adjustment transaction using MongoDB session
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const transaction = new this.transactionModel({
          _id: uuidv4(),
          tenantId,
          customerId,
          type: amount > 0 ? TransactionType.ISSUE : TransactionType.REDEEM,
          amount: Math.abs(amount),
          status: TransactionStatus.COMPLETED,
          idempotencyKey,
          metadata: {
            type: 'MANUAL_ADJUSTMENT',
            reason,
            adjustedBy: userId,
          },
        });
        await transaction.save({ session });

        // Append ledger entry
        const ledgerEntry = await this.ledgerService.appendEntry(
          tenantId,
          customerId,
          amount,
          idempotencyKey,
          transaction._id,
          'MANUAL_ADJUSTMENT',
          session,
        );

        // Write outbox event
        await this.outboxService.writeEvent(
          tenantId,
          amount > 0 ? 'points.issued' : 'points.redeemed',
          {
            transactionId: transaction._id,
            customerId,
            amount,
            balanceAfter: ledgerEntry.balanceAfter,
            reason,
            type: 'MANUAL_ADJUSTMENT',
          },
          session,
        );

        // Audit log (within transaction)
        await this.auditService.log(
          tenantId,
          userId,
          'MANUAL_ADJUSTMENT',
          'transaction',
          transaction._id,
          {
            customerId,
            amount,
            reason,
          },
          session,
        );

        return { transaction, balanceAfter: ledgerEntry.balanceAfter };
      });
    } finally {
      await session.endSession();
    }

    // Get the transaction to return
    const transaction = await this.transactionModel.findOne({ idempotencyKey }).exec();
    const balanceAfter = await this.ledgerService.getBalance(tenantId, customerId);

    return {
      transactionId: transaction?._id,
      amount,
      balanceAfter,
    };
  }

  /**
   * Transaction reversal (soft)
   */
  async reverseTransaction(
    tenantId: string,
    transactionId: string,
    reason: string,
    userId: string,
  ) {
    const transaction = await this.transactionModel.findOne({
      _id: transactionId,
      tenantId,
    }).exec();

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (transaction.status === TransactionStatus.FAILED) {
      throw new BadRequestException('Cannot reverse a failed transaction');
    }

    // Calculate reversal amount (opposite sign)
    const reversalAmount = -Number(transaction.amount);

    // Create reversal transaction
    const reversalIdempotencyKey = `reversal-${transactionId}-${Date.now()}`;

    const result = await this.manualAdjustment(
      tenantId,
      transaction.customerId,
      reversalAmount,
      `Reversal of ${transactionId}: ${reason}`,
      userId,
      reversalIdempotencyKey,
    );

    // Update original transaction metadata
    const metadata = transaction.metadata || {};
    await this.transactionModel.updateOne(
      { _id: transactionId },
      {
        metadata: {
          ...metadata,
          reversed: true,
          reversalTransactionId: result.transactionId,
          reversalReason: reason,
          reversedAt: new Date().toISOString(),
        },
      }
    ).exec();

    // Audit log
    await this.auditService.log(
      tenantId,
      userId,
      'TRANSACTION_REVERSED',
      'transaction',
      transactionId,
      {
        reversalTransactionId: result.transactionId,
        reason,
      },
    );

    return result;
  }
}
