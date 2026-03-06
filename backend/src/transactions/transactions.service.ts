import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, ClientSession } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
  TransactionStatus,
} from '../database/schemas/Transaction.schema';
import { Customer, CustomerDocument } from '../database/schemas/Customer.schema';
import { Device, DeviceDocument } from '../database/schemas/Device.schema';
import { Location, LocationDocument } from '../database/schemas/Location.schema';
import {
  Redemption,
  RedemptionDocument,
  RedemptionStatus,
} from '../database/schemas/Redemption.schema';
import { Reward, RewardDocument } from '../database/schemas/Reward.schema';
import { ScanEvent, ScanEventDocument } from '../database/schemas/ScanEvent.schema';
import { User, UserDocument } from '../database/schemas/User.schema';
import {
  PilotOnboardingFunnel,
  PilotOnboardingFunnelDocument,
} from '../database/schemas/PilotOnboardingFunnel.schema';
import { LedgerService } from '../ledger/ledger.service';
import { OutboxService } from '../outbox/outbox.service';
import { FraudSignalsService } from '../fraud-signals/fraud-signals.service';
import { PilotMetricsService } from '../pilot-metrics/pilot-metrics.service';
import { getCustomerInfoById } from '../common/customer-data';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService {
  private transactionsSupportedCache: boolean | null = null;

  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(Redemption.name) private redemptionModel: Model<RedemptionDocument>,
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    @InjectModel(ScanEvent.name) private scanEventModel: Model<ScanEventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PilotOnboardingFunnel.name)
    private funnelModel: Model<PilotOnboardingFunnelDocument>,
    private ledgerService: LedgerService,
    private outboxService: OutboxService,
    private fraudSignalsService: FraudSignalsService,
    private pilotMetricsService: PilotMetricsService,
  ) {}

  private async supportsTransactions(): Promise<boolean> {
    if (this.transactionsSupportedCache !== null) {
      return this.transactionsSupportedCache;
    }

    try {
      if (!this.connection.db) {
        this.transactionsSupportedCache = false;
        return this.transactionsSupportedCache;
      }
      const hello = await this.connection.db.admin().command({ hello: 1 });
      this.transactionsSupportedCache = Boolean(hello.setName || hello.msg === 'isdbgrid');
    } catch {
      this.transactionsSupportedCache = false;
    }

    return this.transactionsSupportedCache;
  }

  private isTransactionUnsupportedError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const msg = error.message.toLowerCase();
    return msg.includes('replica set member') || msg.includes('mongos');
  }

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
    const existing = await this.transactionModel
      .findOne({
        tenantId,
        idempotencyKey,
      })
      .exec();

    if (existing) {
      const balance = await this.ledgerService.getBalance(tenantId, customerId);
      return {
        id: existing._id,
        type: existing.type,
        amount: Number(existing.amount),
        status: existing.status,
        balance,
      };
    }

    // Validate customer exists
    const customer = await this.customerModel.findById(customerId).exec();

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    // Validate device if provided
    if (deviceId) {
      const device = await this.deviceModel
        .findOne({
          _id: deviceId,
          tenantId,
          isActive: true,
        })
        .exec();

      if (!device) {
        throw new NotFoundException(`Device ${deviceId} not found or inactive`);
      }
    }

    if (!(await this.supportsTransactions())) {
      return this.issuePointsWithoutTransaction(
        tenantId,
        customerId,
        amount,
        deviceId,
        idempotencyKey,
      );
    }

    // Create transaction and ledger entry atomically using MongoDB session
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Create transaction record
      const transaction = new this.transactionModel({
        _id: uuidv4(),
        tenantId,
        customerId,
        type: TransactionType.ISSUE,
        amount: amount,
        status: TransactionStatus.COMPLETED,
        idempotencyKey,
        deviceId: deviceId || undefined,
      });

      await transaction.save({ session });

      // Append ledger entry (idempotent) - use session
      const ledgerEntry = await this.ledgerService.appendEntry(
        tenantId,
        customerId,
        amount,
        idempotencyKey,
        transaction._id,
        'ISSUE',
        session,
      );

      // Write outbox event (atomic with transaction)
      await this.outboxService.writeEvent(
        tenantId,
        'points.issued',
        {
          transactionId: transaction._id,
          customerId,
          amount,
          balanceAfter: ledgerEntry.balanceAfter,
          deviceId,
          idempotencyKey,
        },
        session,
      );

      await session.commitTransaction();

      // Track fraud signals (outside transaction)
      await this.fraudSignalsService.trackScan(tenantId, deviceId, customerId);

      // Track onboarding milestone (first scan only)
      const funnel = await this.funnelModel.findOne({ tenantId }).exec();
      if (!funnel?.firstScanAt) {
        await this.pilotMetricsService.trackOnboardingMilestone(tenantId, 'first_scan');
      }

      return {
        id: transaction._id,
        type: transaction.type,
        amount: Number(transaction.amount),
        status: transaction.status,
        balance: ledgerEntry.balanceAfter,
      };
    } catch (error) {
      await session.abortTransaction();
      if (this.isTransactionUnsupportedError(error)) {
        this.transactionsSupportedCache = false;
        return this.issuePointsWithoutTransaction(
          tenantId,
          customerId,
          amount,
          deviceId,
          idempotencyKey,
        );
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async issuePointsWithoutTransaction(
    tenantId: string,
    customerId: string,
    amount: number,
    deviceId: string | null,
    idempotencyKey: string,
  ) {
    const transaction = new this.transactionModel({
      _id: uuidv4(),
      tenantId,
      customerId,
      type: TransactionType.ISSUE,
      amount,
      status: TransactionStatus.COMPLETED,
      idempotencyKey,
      deviceId: deviceId || undefined,
    });

    await transaction.save();

    const ledgerEntry = await this.ledgerService.appendEntry(
      tenantId,
      customerId,
      amount,
      idempotencyKey,
      transaction._id,
      'ISSUE',
    );

    await this.outboxService.writeEvent(tenantId, 'points.issued', {
      transactionId: transaction._id,
      customerId,
      amount,
      balanceAfter: ledgerEntry.balanceAfter,
      deviceId,
      idempotencyKey,
    });

    await this.fraudSignalsService.trackScan(tenantId, deviceId, customerId);

    const funnel = await this.funnelModel.findOne({ tenantId }).exec();
    if (!funnel?.firstScanAt) {
      await this.pilotMetricsService.trackOnboardingMilestone(tenantId, 'first_scan');
    }

    return {
      id: transaction._id,
      type: transaction.type,
      amount: Number(transaction.amount),
      status: transaction.status,
      balance: ledgerEntry.balanceAfter,
    };
  }

  async redeemPoints(
    tenantId: string,
    customerId: string,
    rewardId: string,
    idempotencyKey: string,
  ) {
    // Check idempotency
    const existing = await this.redemptionModel
      .findOne({
        tenantId,
        idempotencyKey,
      })
      .exec();

    if (existing && existing.status === RedemptionStatus.COMPLETED) {
      const balance = await this.ledgerService.getBalance(tenantId, customerId);
      return {
        id: existing._id,
        status: existing.status,
        pointsDeducted: Number(existing.pointsDeducted),
        balance,
      };
    }

    // Get reward
    const reward = await this.rewardModel
      .findOne({
        _id: rewardId,
        tenantId,
        isActive: true,
      })
      .exec();

    if (!reward) {
      throw new NotFoundException(`Reward ${rewardId} not found`);
    }

    // For stamp rewards use stampsCost; for points rewards use pointsRequired
    const pointsRequired =
      (reward as any).rewardType === 'stamps'
        ? Number((reward as any).stampsCost ?? 0)
        : Number(reward.pointsRequired);

    if (pointsRequired <= 0) {
      throw new BadRequestException(`Reward ${rewardId} has no cost configured`);
    }

    // ── Type-aware pre-flight balance check ─────────────────────────────────
    // The raw ledger balance mixes stamps + bonus points into a single number.
    // We must validate against the *correct* balance for each reward type.
    const stampsCount = await this.computeStampCount(tenantId, customerId);
    const totalBalance = await this.ledgerService.getBalance(tenantId, customerId);

    if ((reward as any).rewardType === 'stamps') {
      // Stamp reward: only stamps (issued with stampIssued:true) count
      if (stampsCount < pointsRequired) {
        throw new BadRequestException(
          `Insufficient stamps. Customer has ${stampsCount} stamp(s) but this reward requires ${pointsRequired}.`,
        );
      }
    } else {
      // Points reward: only the points portion of the balance counts
      const pointsBalance = Math.max(0, totalBalance - stampsCount);
      if (pointsBalance < pointsRequired) {
        throw new BadRequestException(
          `Insufficient points. Customer has ${pointsBalance} point(s) but this reward requires ${pointsRequired}.`,
        );
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    if (!(await this.supportsTransactions())) {
      return this.redeemPointsWithoutTransaction(
        tenantId,
        customerId,
        rewardId,
        idempotencyKey,
        pointsRequired,
      );
    }

    // Use MongoDB session for atomic transaction
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const balance = await this.ledgerService.getBalance(tenantId, customerId);

      // Ensure the total ledger never goes below 0 (safety net)
      if (balance - pointsRequired < 0) {
        throw new BadRequestException(
          `Insufficient balance. Customer has ${balance}, but reward requires ${pointsRequired}.`,
        );
      }

      // Create redemption record
      const redemption = new this.redemptionModel({
        _id: uuidv4(),
        tenantId,
        customerId,
        rewardId,
        pointsDeducted: pointsRequired,
        status: RedemptionStatus.COMPLETED,
        idempotencyKey,
        completedAt: new Date(),
      });

      await redemption.save({ session });

      // Create transaction record
      const transaction = new this.transactionModel({
        _id: uuidv4(),
        tenantId,
        customerId,
        type: TransactionType.REDEEM,
        amount: -pointsRequired,
        status: TransactionStatus.COMPLETED,
        idempotencyKey: `${idempotencyKey}-tx`,
      });

      await transaction.save({ session });

      // Append ledger entry (negative amount) - use session
      const ledgerEntry = await this.ledgerService.appendEntry(
        tenantId,
        customerId,
        -pointsRequired,
        idempotencyKey,
        transaction._id,
        'REDEEM',
        session,
      );

      // Write outbox event
      await this.outboxService.writeEvent(
        tenantId,
        'points.redeemed',
        {
          redemptionId: redemption._id,
          transactionId: transaction._id,
          customerId,
          rewardId,
          pointsDeducted: pointsRequired,
          balanceAfter: ledgerEntry.balanceAfter,
          idempotencyKey,
        },
        session,
      );

      await session.commitTransaction();

      // Track fraud signals (outside transaction)
      await this.fraudSignalsService.trackRedemption(tenantId, customerId, true);

      return {
        id: redemption._id,
        status: redemption.status,
        pointsDeducted: Number(redemption.pointsDeducted),
        balance: ledgerEntry.balanceAfter,
      };
    } catch (error) {
      await session.abortTransaction();
      if (this.isTransactionUnsupportedError(error)) {
        this.transactionsSupportedCache = false;
        return this.redeemPointsWithoutTransaction(
          tenantId,
          customerId,
          rewardId,
          idempotencyKey,
          pointsRequired,
        );
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async redeemPointsWithoutTransaction(
    tenantId: string,
    customerId: string,
    rewardId: string,
    idempotencyKey: string,
    pointsRequired: number,
  ) {
    // The type-aware pre-flight check in redeemPoints() already ran before this path.
    // Keep a simple safety net against the ledger going negative.
    const balance = await this.ledgerService.getBalance(tenantId, customerId);

    if (balance - pointsRequired < 0) {
      throw new BadRequestException(
        `Insufficient balance. Customer has ${balance}, but reward requires ${pointsRequired}.`,
      );
    }

    const redemption = new this.redemptionModel({
      _id: uuidv4(),
      tenantId,
      customerId,
      rewardId,
      pointsDeducted: pointsRequired,
      status: RedemptionStatus.COMPLETED,
      idempotencyKey,
      completedAt: new Date(),
    });
    await redemption.save();

    const transaction = new this.transactionModel({
      _id: uuidv4(),
      tenantId,
      customerId,
      type: TransactionType.REDEEM,
      amount: -pointsRequired,
      status: TransactionStatus.COMPLETED,
      idempotencyKey: `${idempotencyKey}-tx`,
    });
    await transaction.save();

    const ledgerEntry = await this.ledgerService.appendEntry(
      tenantId,
      customerId,
      -pointsRequired,
      idempotencyKey,
      transaction._id,
      'REDEEM',
    );

    await this.outboxService.writeEvent(tenantId, 'points.redeemed', {
      redemptionId: redemption._id,
      transactionId: transaction._id,
      customerId,
      rewardId,
      pointsDeducted: pointsRequired,
      balanceAfter: ledgerEntry.balanceAfter,
      idempotencyKey,
    });

    await this.fraudSignalsService.trackRedemption(tenantId, customerId, true);

    return {
      id: redemption._id,
      status: redemption.status,
      pointsDeducted: Number(redemption.pointsDeducted),
      balance: ledgerEntry.balanceAfter,
    };
  }

  async redeemPointsFailure(tenantId: string, customerId: string) {
    // Track failed redemption
    await this.fraudSignalsService.trackRedemption(tenantId, customerId, false);
  }

  /**
   * Computes the net number of stamps a customer has with a given tenant.
   * stamps_count = (ISSUE txns with stampIssued:true) - (completed stamp reward redemptions)
   * This is the source-of-truth for stamp balance validation.
   */
  private async computeStampCount(tenantId: string, customerId: string): Promise<number> {
    const issuedAgg = await this.transactionModel
      .aggregate([
        {
          $match: {
            tenantId,
            customerId,
            type: TransactionType.ISSUE,
            'metadata.stampIssued': true,
          },
        },
        { $group: { _id: null, total: { $sum: { $toDouble: '$amount' } } } },
      ])
      .exec();
    const stampsIssued = Math.round(issuedAgg[0]?.total ?? 0);

    const stampRewards = await this.rewardModel
      .find({ tenantId, rewardType: 'stamps' })
      .select('_id')
      .exec();
    const stampRewardIds = stampRewards.map((r) => r._id as string);

    let stampsRedeemed = 0;
    if (stampRewardIds.length > 0) {
      const redeemedAgg = await this.redemptionModel
        .aggregate([
          {
            $match: {
              tenantId,
              customerId,
              rewardId: { $in: stampRewardIds },
              status: RedemptionStatus.COMPLETED,
            },
          },
          { $group: { _id: null, total: { $sum: { $toDouble: '$pointsDeducted' } } } },
        ])
        .exec();
      stampsRedeemed = Math.round(redeemedAgg[0]?.total ?? 0);
    }

    return Math.max(0, stampsIssued - stampsRedeemed);
  }

  async findAll(
    tenantId: string,
    params?: {
      page?: number;
      limit?: number;
      type?: 'ISSUE' | 'REDEEM';
      customerId?: string;
      staffId?: string;
      locationId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = { tenantId };

    if (params?.type) {
      query.type = params.type;
    }

    if (params?.customerId) {
      query.customerId = params.customerId;
    }

    if (params?.startDate) {
      query.createdAt = { $gte: params.startDate };
    }

    if (params?.endDate) {
      const endDate = new Date(params.endDate);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt = { ...query.createdAt, $lte: endDate };
    }

    // If filtering by location, get devices at that location first
    let deviceIdsAtLocation: string[] | null = null;
    if (params?.locationId) {
      const devicesAtLocation = await this.deviceModel
        .find({ tenantId, locationId: params.locationId })
        .select('_id')
        .exec();
      deviceIdsAtLocation = devicesAtLocation.map((d) => d._id);
      query.deviceId = { $in: deviceIdsAtLocation };
    }

    const [transactions, total] = await Promise.all([
      this.transactionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.transactionModel.countDocuments(query).exec(),
    ]);

    // Get all device IDs from transactions to look up locations
    const deviceIds = transactions
      .map((tx: TransactionDocument) => tx.deviceId)
      .filter((id): id is string => !!id);

    // Get devices with their location IDs
    const devices = await this.deviceModel
      .find({ _id: { $in: deviceIds } })
      .select('_id locationId')
      .exec();

    // Create device -> locationId map
    const deviceLocationMap = new Map<string, string>();
    devices.forEach((d: DeviceDocument) => {
      if (d.locationId) {
        deviceLocationMap.set(d._id, d.locationId);
      }
    });

    // Collect all location IDs - from devices AND from transaction metadata (branchId)
    const deviceLocationIds = devices.map((d: DeviceDocument) => d.locationId).filter(Boolean);
    const metadataBranchIds = transactions
      .map((tx: TransactionDocument) => (tx.metadata as any)?.branchId)
      .filter(Boolean);
    const allLocationIds = [...new Set([...deviceLocationIds, ...metadataBranchIds])];

    // Get all locations and their CURRENT names
    const locations = await this.locationModel
      .find({ _id: { $in: allLocationIds } })
      .select('_id name')
      .exec();

    // Create locationId -> CURRENT name map (always use fresh data from DB)
    const locationNameMap = new Map<string, string>();
    locations.forEach((loc: LocationDocument) => {
      locationNameMap.set(loc._id, loc.name);
    });

    // Get staff info from ScanEvent for transactions
    const idempotencyKeys = transactions.map((tx: TransactionDocument) => tx.idempotencyKey);
    const scanEvents = await this.scanEventModel
      .find({
        tenantId,
        idempotencyKey: { $in: idempotencyKeys },
      })
      .populate('staffUserId', 'email', this.userModel)
      .exec();

    // Create a map of idempotencyKey -> staff info
    const staffMap = new Map<string, { id: string; name: string }>();
    scanEvents.forEach((se: ScanEventDocument) => {
      const staffUser = (se as any).staffUserId;
      if (staffUser) {
        // After populate, staffUserId is a User object, extract the ID
        const staffUserId =
          typeof staffUser === 'object' && staffUser._id
            ? staffUser._id
            : typeof staffUser === 'string'
              ? staffUser
              : se.staffUserId;
        staffMap.set(se.idempotencyKey, {
          id: staffUserId,
          name: staffUser.email?.split('@')[0] || 'Staff',
        });
      }
    });

    // Look up real customer names from User documents (source of truth)
    const uniqueCustomerIds = [...new Set(transactions.map((tx: TransactionDocument) => tx.customerId))];
    const customerUsers = await this.userModel
      .find({ customerId: { $in: uniqueCustomerIds } })
      .select('customerId name email')
      .exec();
    const customerUserMap = new Map<string, { name: string; email: string }>();
    customerUsers.forEach((u) => {
      if (u.customerId) customerUserMap.set(u.customerId, { name: u.name || '', email: u.email });
    });

    return {
      data: transactions.map((tx: TransactionDocument) => {
        const customerId = tx.customerId;
        const txMeta = tx.metadata as any;
        // Use real User name as source of truth; fallback to hash-based name only if no User found
        const customerName = customerUserMap.get(customerId)?.name || getCustomerInfoById(customerId).name;
        const numericPoints = Math.abs(Number(tx.amount));
        const parsedPurchaseAmount =
          txMeta?.purchaseAmount === undefined || txMeta?.purchaseAmount === null
            ? undefined
            : Number(txMeta.purchaseAmount);
        const issueAmount =
          parsedPurchaseAmount !== undefined && Number.isFinite(parsedPurchaseAmount)
            ? parsedPurchaseAmount
            : numericPoints;

        // Get staff info from scan event or metadata
        const staffInfo = staffMap.get(tx.idempotencyKey) ||
          (txMeta?.staffUserId && txMeta?.staffName
            ? {
                id: txMeta.staffUserId,
                name: txMeta.staffName,
              }
            : null) || { id: '', name: 'System' };

        // Get branch/location - use branchId from metadata, but ALWAYS look up current name from DB
        let branchId = txMeta?.branchId || '';

        // If no branchId in metadata, try to look up from device
        if (!branchId && tx.deviceId) {
          branchId = deviceLocationMap.get(tx.deviceId) || '';
        }

        // Always get the CURRENT branch name from DB (not stored in metadata)
        // This ensures updates to branch names are reflected immediately
        const branchName = branchId
          ? locationNameMap.get(branchId) || txMeta?.branchName || ''
          : txMeta?.branchName || '';

        return {
          id: tx._id,
          customerId,
          customerName,
          type: tx.type === TransactionType.ISSUE ? 'earn' : 'redeem',
          points: tx.type === TransactionType.ISSUE ? numericPoints : -numericPoints,
          amount: tx.type === TransactionType.ISSUE ? issueAmount : undefined,
          stampIssued: txMeta?.stampIssued === true,
          staffId: staffInfo.id,
          staffName: staffInfo.name,
          branchId,
          branchName,
          timestamp: (tx as any).createdAt || new Date(),
          status: tx.status.toLowerCase() as 'completed' | 'failed' | 'pending',
        };
      }),
      total,
    };
  }
}
