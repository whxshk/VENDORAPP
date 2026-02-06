import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TransactionsService } from '../transactions/transactions.service';
import { CustomersService } from '../customers/customers.service';
import { AuditService } from '../audit/audit.service';
import { RulesetsService } from '../rulesets/rulesets.service';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { User, UserDocument } from '../database/schemas/User.schema';
import { Customer, CustomerDocument } from '../database/schemas/Customer.schema';
import { CustomerMerchantAccount, CustomerMerchantAccountDocument } from '../database/schemas/CustomerMerchantAccount.schema';
import { ScanEvent, ScanEventDocument } from '../database/schemas/ScanEvent.schema';
import { Reward, RewardDocument } from '../database/schemas/Reward.schema';
import { Transaction, TransactionDocument } from '../database/schemas/Transaction.schema';
import { Location, LocationDocument } from '../database/schemas/Location.schema';
import { verifyQrPayload, parseQrPayloadFields } from '../common/qr-payload';
import { v4 as uuidv4 } from 'uuid';

const CHECKIN_THROTTLE_SEC = 60;

@Injectable()
export class ScanService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerMerchantAccount.name) private accountModel: Model<CustomerMerchantAccountDocument>,
    @InjectModel(ScanEvent.name) private scanEventModel: Model<ScanEventDocument>,
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    private transactionsService: TransactionsService,
    private customersService: CustomersService,
    private auditService: AuditService,
    private rulesetsService: RulesetsService,
  ) {}

  async apply(
    tenantId: string,
    staffUserId: string,
    dto: {
      qrPayload: string;
      purpose: 'CHECKIN' | 'PURCHASE' | 'REDEEM';
      amount?: number;
      rewardId?: string;
      deviceId?: string | null;
    },
    idempotencyKey: string,
  ) {
    const [tenant, user] = await Promise.all([
      this.tenantModel.findById(tenantId).select('isActive').exec(),
      this.userModel.findOne({ _id: staffUserId, tenantId }).select('isActive').exec(),
    ]);
    if (!tenant?.isActive) throw new ForbiddenException('Tenant is disabled');
    if (!user?.isActive) throw new ForbiddenException('Staff user is disabled');

    const parsed = parseQrPayloadFields(dto.qrPayload);
    if (!parsed) throw new BadRequestException('Invalid or missing QR payload');
    const customer = await this.customerModel.findById(parsed.c).exec();
    if (!customer) throw new BadRequestException('Customer not found');
    const account = await this.accountModel.findOne({ tenantId, customerId: parsed.c }).exec();
    if (!account) throw new BadRequestException('Customer not associated with this merchant');
    if (account.membershipStatus === 'DISABLED')
      throw new ForbiddenException('Customer account is disabled');

    const interval = customer.rotationIntervalSec ?? 120;
    const v = verifyQrPayload(dto.qrPayload, customer.qrTokenSecret, interval);
    if ('error' in v) throw new BadRequestException(v.error);
    const customerId = v.customerId;

    const customerDetail = await this.customersService.findOne(tenantId, customerId);

    if (dto.purpose === 'CHECKIN') {
      const existing = await this.scanEventModel.findOne({
        tenantId,
        idempotencyKey,
      }).exec();
      if (existing)
        return { success: true, purpose: 'CHECKIN' as const, customerId };

      const since = new Date(Date.now() - CHECKIN_THROTTLE_SEC * 1000);
      const recent = await this.scanEventModel.findOne({
        customerId,
        purpose: 'CHECKIN',
        createdAt: { $gte: since },
      }).exec();
      if (recent)
        throw new ConflictException('Check-in throttled. Try again later.');

      const ev = new this.scanEventModel({
        _id: uuidv4(),
        tenantId,
        customerId,
        staffUserId,
        deviceId: dto.deviceId ?? undefined,
        purpose: 'CHECKIN',
        status: 'OK',
        idempotencyKey,
      });
      await ev.save();
      await this.auditService.log(tenantId, staffUserId, 'SCAN_APPLY', 'scan', ev._id, {
        purpose: 'CHECKIN',
        customerId,
      });
      return { success: true, purpose: 'CHECKIN' as const, customerId };
    }

    if (dto.purpose === 'PURCHASE') {
      const amount = typeof dto.amount === 'number' ? dto.amount : 0;
      if (!amount || amount <= 0)
        throw new BadRequestException('amount is required and must be > 0 for PURCHASE');
      const pointsPer = await this.rulesetsService.getPointsConversion(tenantId);
      const points = Math.floor(amount * pointsPer);
      if (points <= 0)
        throw new BadRequestException('Purchase amount must yield at least 1 point');

      const result = await this.transactionsService.issuePoints(
        tenantId,
        customerId,
        points,
        dto.deviceId ?? null,
        idempotencyKey,
      );
      await this.transactionModel.findByIdAndUpdate(result.id, {
        $set: {
          metadata: {
            purchaseAmount: amount,
            pointsEarned: points,
            customerName: customerDetail.name,
            customerEmail: customerDetail.email,
            customerPhone: customerDetail.phone,
          },
        },
      }).exec();

      let scanEvId: string | null = null;
      try {
        const ev = new this.scanEventModel({
          _id: uuidv4(),
          tenantId,
          customerId,
          staffUserId,
          deviceId: dto.deviceId ?? undefined,
          purpose: 'PURCHASE',
          amount: amount,
          status: 'OK',
          idempotencyKey,
        });
        await ev.save();
        scanEvId = ev._id;
      } catch (e: any) {
        if (e?.code !== 11000) throw e; // MongoDB duplicate key error
      }
      if (scanEvId) {
        await this.auditService.log(tenantId, staffUserId, 'SCAN_APPLY', 'scan', scanEvId, {
          purpose: 'PURCHASE',
          customerId,
          transactionId: result.id,
          amount,
          points,
        });
      }
      return {
        success: true,
        purpose: 'PURCHASE' as const,
        customerId,
        transactionId: result.id,
        balance: result.balance,
      };
    }

    if (!dto.rewardId) throw new BadRequestException('rewardId is required for REDEEM');
    const reward = await this.rewardModel.findOne({
      _id: dto.rewardId,
      tenantId,
      isActive: true,
    }).exec();
    if (!reward) throw new NotFoundException(`Reward ${dto.rewardId} not found`);

    const result = await this.transactionsService.redeemPoints(
      tenantId,
      customerId,
      dto.rewardId,
      idempotencyKey,
    );
    const tx = await this.transactionModel.findOne({
      tenantId,
      customerId,
      idempotencyKey: `${idempotencyKey}-tx`,
    }).sort({ createdAt: -1 }).exec();
    if (tx) {
      await this.transactionModel.findByIdAndUpdate(tx._id, {
        $set: {
          metadata: {
            ...((tx.metadata as Record<string, unknown>) || {}),
            customerName: customerDetail.name,
            customerEmail: customerDetail.email,
            customerPhone: customerDetail.phone,
            rewardName: reward.name,
          },
        },
      }).exec();
    }

    let scanEvId: string | null = null;
    try {
      const ev = new this.scanEventModel({
        _id: uuidv4(),
        tenantId,
        customerId,
        staffUserId,
        deviceId: dto.deviceId ?? undefined,
        purpose: 'REDEEM',
        rewardId: dto.rewardId,
        amount: -Number(reward.pointsRequired),
        status: 'OK',
        idempotencyKey,
      });
      await ev.save();
      scanEvId = ev._id;
    } catch (e: any) {
      if (e?.code !== 11000) throw e; // MongoDB duplicate key error
    }
    if (scanEvId) {
      await this.auditService.log(tenantId, staffUserId, 'SCAN_APPLY', 'scan', scanEvId, {
        purpose: 'REDEEM',
        customerId,
        rewardId: dto.rewardId,
        pointsDeducted: Number(reward.pointsRequired),
      });
    }
    return {
      success: true,
      purpose: 'REDEEM' as const,
      customerId,
      transactionId: tx?.id,
      balance: result.balance,
    };
  }

  async simulate(
    tenantId: string,
    customerIdInput: string,
    type: 'earn' | 'redeem',
    amount?: number,
    rewardId?: string,
    idempotencyKey?: string,
    locationId?: string,
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
        const allAccounts = await this.accountModel
          .find({ tenantId })
          .sort({ createdAt: 1 })
          .exec();

        const allCustomerIds = allAccounts.map((acc: CustomerMerchantAccountDocument) => acc.customerId);
        const allCustomers = await this.customerModel
          .find({ _id: { $in: allCustomerIds } })
          .exec();
        const customerMap = new Map(allCustomers.map((c: CustomerDocument) => [c._id, c]));

        const index = parseInt(actualCustomerId, 10) - 1;
        if (index >= 0 && index < allAccounts.length) {
          actualCustomerId = allAccounts[index].customerId;
        } else {
          return {
            success: false,
            error: `Customer with ID ${customerIdInput} not found`,
          };
        }
      } else {
        // Try to find by UUID
        const account = await this.accountModel.findOne({
          tenantId,
          customerId: actualCustomerId,
        }).exec();

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

      // Look up location/branch name if locationId provided
      let branchName: string | undefined;
      if (locationId) {
        const location = await this.locationModel.findOne({ _id: locationId, tenantId }).exec();
        branchName = location?.name;
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

        // Update transaction metadata to store QAR amount and location
        await this.transactionModel.findByIdAndUpdate(result.id, {
          $set: {
            metadata: {
              purchaseAmount: qarAmount,
              pointsEarned: pointsToIssue,
              customerName: customer.name,
              customerEmail: customer.email,
              customerPhone: customer.phone,
              branchId: locationId,
              branchName: branchName,
            },
          },
        }).exec();

        // Get the transaction record with updated metadata
        const transaction = await this.transactionModel.findById(result.id).exec();

        // Get updated customer balance
        const updatedCustomer = await this.customersService.findOne(tenantId, actualCustomerId);

        const txMetadata = transaction?.metadata as any || {};

        return {
          success: true,
          transaction: {
            id: transaction?._id || result.id,
            customerId: actualCustomerId,
            customerName: customer.name,
            type: 'earn',
            points: pointsToIssue, // Show points earned, not QAR
            amount: txMetadata.purchaseAmount || qarAmount, // QAR amount for reference
            staffId: '',
            staffName: 'System',
            branchId: locationId,
            branchName: branchName,
            timestamp: (transaction as any)?.createdAt || new Date(),
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
        const reward = await this.rewardModel.findOne({
          _id: rewardId,
          tenantId,
        }).exec();

        // Get the transaction record (the transaction uses idempotencyKey with -tx suffix)
        const transaction = await this.transactionModel.findOne({
          tenantId,
          customerId: actualCustomerId,
          idempotencyKey: `${actualIdempotencyKey}-tx`,
        }).sort({ createdAt: -1 }).exec();

        // Update transaction metadata with customer info and location
        if (transaction) {
          await this.transactionModel.findByIdAndUpdate(transaction._id, {
            $set: {
              metadata: {
                ...((transaction.metadata as any) || {}),
                customerName: customer.name,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                rewardName: reward?.name,
                branchId: locationId,
                branchName: branchName,
              },
            },
          }).exec();
        }

        // Get updated customer balance
        const updatedCustomer = await this.customersService.findOne(tenantId, actualCustomerId);

        return {
          success: true,
          transaction: {
            id: transaction?._id || '',
            customerId: actualCustomerId,
            customerName: customer.name,
            type: 'redeem',
            points: -Number(result.pointsDeducted), // Negative for redeem
            rewardId,
            rewardName: reward?.name,
            staffId: '',
            staffName: 'System',
            branchId: locationId,
            branchName: branchName,
            timestamp: (transaction as any)?.createdAt || new Date(),
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
