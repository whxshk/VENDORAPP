import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
} from '../database/schemas/Transaction.schema';
import { Device, DeviceDocument } from '../database/schemas/Device.schema';
import { ScanEvent, ScanEventDocument } from '../database/schemas/ScanEvent.schema';
import { User, UserDocument } from '../database/schemas/User.schema';
import { getCustomerInfoById } from '../common/customer-data';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(ScanEvent.name) private scanEventModel: Model<ScanEventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getDashboard(tenantId: string, locationId?: string) {
    // Build base query for filtering
    const baseQuery: any = { tenantId };

    // If locationId is provided, filter transactions by device location
    if (locationId) {
      // Get all device IDs for this location
      const devices = await this.deviceModel
        .find({
          tenantId,
          locationId,
          isActive: true,
        })
        .select('_id')
        .exec();

      const deviceIds = devices.map((d) => d._id);

      if (deviceIds.length > 0) {
        baseQuery.deviceId = { $in: deviceIds };
      } else {
        // No devices for this location, return zeros
        return {
          todaysCustomers: 0,
          repeatCustomers: 0,
          totalTransactions: 0,
          redemptionRate: 0,
          loyaltyMode: 'points' as const,
          stampsIssued: 0,
          stampIssueCount: 0,
          pointsIssued: 0,
          pointsRedeemed: 0,
          earnCount: 0,
          redeemCount: 0,
          recentActivity: [],
          alerts: [],
        };
      }
    }

    // Get today's customers (distinct customers with transactions today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysTransactions = await this.transactionModel
      .find({
        ...baseQuery,
        createdAt: {
          $gte: today,
          $lt: tomorrow,
        },
      })
      .select('customerId')
      .exec();

    const uniqueCustomerIds = [...new Set(todaysTransactions.map((tx) => tx.customerId))];
    const todaysCustomers = uniqueCustomerIds.length;

    // Get repeat customers (customers with more than 1 transaction)
    const customersWithTransactions = await this.transactionModel
      .aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$customerId',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const repeatCustomers = customersWithTransactions.filter((c) => c.count > 1).length;

    // Get total transactions
    const totalTransactions = await this.transactionModel.countDocuments(baseQuery).exec();

    // Split ISSUE transactions by stamp vs points; aggregate REDEEM separately
    const issueAgg = await this.transactionModel
      .aggregate([
        { $match: { ...baseQuery, type: TransactionType.ISSUE } },
        {
          $group: {
            _id: { $cond: [{ $eq: ['$metadata.stampIssued', true] }, 'stamp', 'points'] },
            count: { $sum: 1 },
            total: { $sum: { $toDouble: '$amount' } },
          },
        },
      ])
      .exec();

    const redeemAgg = await this.transactionModel
      .aggregate([
        { $match: { ...baseQuery, type: TransactionType.REDEEM } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: { $toDouble: '$amount' } } } },
      ])
      .exec();

    let stampIssueCount = 0;
    let stampsIssued = 0;
    let pointIssueCount = 0;
    let pointsIssued = 0;
    for (const row of issueAgg) {
      if (row._id === 'stamp') {
        stampIssueCount = row.count;
        stampsIssued = Math.round(row.total);
      } else {
        pointIssueCount = row.count;
        pointsIssued = Math.round(row.total);
      }
    }
    const issueCount = stampIssueCount + pointIssueCount;
    const redeemRow = redeemAgg[0] ?? {};
    const redeemCount: number = redeemRow.count ?? 0;
    const pointsRedeemed = Math.round(redeemRow.total ?? 0);

    // Determine loyalty mode from what transactions have actually occurred
    const loyaltyMode: 'stamps' | 'points' | 'both' =
      stampIssueCount > 0 && pointIssueCount > 0 ? 'both'
      : stampIssueCount > 0 ? 'stamps'
      : 'points';

    const redemptionRate = issueCount > 0 ? Number((redeemCount / issueCount).toFixed(4)) : 0;

    // Get recent activity (last 50 transactions) with staff info
    const recentTransactions = await this.transactionModel
      .find(baseQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    // Get staff info from ScanEvent for transactions
    const idempotencyKeys = recentTransactions.map((tx) => tx.idempotencyKey);
    const scanEvents = await this.scanEventModel
      .find({
        tenantId,
        idempotencyKey: { $in: idempotencyKeys },
      })
      .populate('staffUserId', 'email', this.userModel)
      .exec();

    // Create a map of idempotencyKey -> staff info
    const staffMap = new Map<string, { id: string; name: string }>();
    scanEvents.forEach((se) => {
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
    const activityCustomerIds = [...new Set(recentTransactions.map((tx) => tx.customerId))];
    const activityCustomerUsers = await this.userModel
      .find({ customerId: { $in: activityCustomerIds } })
      .select('customerId name email')
      .exec();
    const activityCustomerMap = new Map<string, string>();
    activityCustomerUsers.forEach((u) => {
      if (u.customerId) {
        activityCustomerMap.set(u.customerId, u.name || u.email?.split('@')[0] || '');
      }
    });

    // Transform to frontend format
    const recentActivity = recentTransactions.map((tx) => {
      const customerId = tx.customerId;
      const txMeta = tx.metadata as any;
      // Use real User name as source of truth; fallback to stored metadata name, then hash-based
      const customerName = activityCustomerMap.get(customerId) || txMeta?.customerName || getCustomerInfoById(customerId).name;
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

      return {
        id: tx._id,
        customerId,
        customerName,
        type: tx.type === TransactionType.ISSUE ? 'earn' : 'redeem',
        points: tx.type === TransactionType.ISSUE ? numericPoints : -numericPoints,
        amount: tx.type === TransactionType.ISSUE ? issueAmount : undefined,
        stampIssued: txMeta?.stampIssued === true,
        rewardId: txMeta?.rewardId || undefined,
        rewardName: txMeta?.rewardName || undefined,
        staffId: staffInfo.id,
        staffName: staffInfo.name,
        branchId: txMeta?.branchId || undefined,
        branchName: txMeta?.branchName || undefined,
        timestamp: (tx as any).createdAt || new Date(),
        status: tx.status.toLowerCase() as 'completed' | 'failed' | 'pending',
      };
    });

    return {
      todaysCustomers,
      repeatCustomers,
      totalTransactions,
      loyaltyMode,
      stampsIssued,
      stampIssueCount,
      pointsIssued,
      pointsRedeemed,
      earnCount: pointIssueCount,
      redeemCount,
      recentActivity,
      alerts: [], // Empty alerts for now
    };
  }
}
