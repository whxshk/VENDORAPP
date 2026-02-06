import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument, TransactionType } from '../database/schemas/Transaction.schema';
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
      const devices = await this.deviceModel.find({
        tenantId,
        locationId,
        isActive: true,
      }).select('_id').exec();
      
      const deviceIds = devices.map(d => d._id);
      
      if (deviceIds.length > 0) {
        baseQuery.deviceId = { $in: deviceIds };
      } else {
        // No devices for this location, return zeros
        return {
          todaysCustomers: 0,
          repeatCustomers: 0,
          totalTransactions: 0,
          redemptionRate: 0,
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

    const uniqueCustomerIds = [...new Set(todaysTransactions.map(tx => tx.customerId))];
    const todaysCustomers = uniqueCustomerIds.length;

    // Get repeat customers (customers with more than 1 transaction)
    const customersWithTransactions = await this.transactionModel.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$customerId',
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const repeatCustomers = customersWithTransactions.filter(
      (c) => c.count > 1,
    ).length;

    // Get total transactions
    const totalTransactions = await this.transactionModel.countDocuments(baseQuery).exec();

    // Calculate redemption rate (redeems / issues)
    const [issueCount, redeemCount] = await Promise.all([
      this.transactionModel.countDocuments({
        ...baseQuery,
        type: TransactionType.ISSUE,
      }).exec(),
      this.transactionModel.countDocuments({
        ...baseQuery,
        type: TransactionType.REDEEM,
      }).exec(),
    ]);

    const redemptionRate =
      issueCount > 0 ? Number((redeemCount / issueCount).toFixed(4)) : 0;

    // Get recent activity (last 10 transactions) with staff info
    const recentTransactions = await this.transactionModel
      .find(baseQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    // Get staff info from ScanEvent for transactions
    const idempotencyKeys = recentTransactions.map(tx => tx.idempotencyKey);
    const scanEvents = await this.scanEventModel
      .find({
        tenantId,
        idempotencyKey: { $in: idempotencyKeys },
      })
      .populate('staffUserId', 'email', this.userModel)
      .exec();

    // Create a map of idempotencyKey -> staff info
    const staffMap = new Map<string, { id: string; name: string }>();
    scanEvents.forEach(se => {
      const staffUser = (se as any).staffUserId;
      if (staffUser) {
        // After populate, staffUserId is a User object, extract the ID
        const staffUserId = typeof staffUser === 'object' && staffUser._id 
          ? staffUser._id 
          : (typeof staffUser === 'string' ? staffUser : se.staffUserId);
        staffMap.set(se.idempotencyKey, {
          id: staffUserId,
          name: staffUser.email?.split('@')[0] || 'Staff',
        });
      }
    });

    // Transform to frontend format
    const recentActivity = recentTransactions.map((tx) => {
      const customerId = tx.customerId;
      // Get customer name from transaction metadata or fallback
      const txMeta = tx.metadata as any;
      const customerName = txMeta?.customerName || getCustomerInfoById(customerId).name;

      // Get staff info from scan event or metadata
      const staffInfo = staffMap.get(tx.idempotencyKey) || 
                       (txMeta?.staffUserId && txMeta?.staffName ? {
                         id: txMeta.staffUserId,
                         name: txMeta.staffName,
                       } : null) ||
                       { id: '', name: 'System' };

      return {
        id: tx._id,
        customerId,
        customerName,
        type: tx.type === TransactionType.ISSUE ? 'earn' : 'redeem',
        points:
          tx.type === TransactionType.ISSUE
            ? Number(tx.amount)
            : -Number(tx.amount),
        amount: tx.type === TransactionType.ISSUE ? Number(tx.amount) : undefined,
        staffId: staffInfo.id,
        staffName: staffInfo.name,
        timestamp: (tx as any).createdAt || new Date(),
        status: tx.status.toLowerCase() as 'completed' | 'failed' | 'pending',
      };
    });

    return {
      todaysCustomers,
      repeatCustomers,
      totalTransactions,
      redemptionRate,
      recentActivity,
      alerts: [], // Empty alerts for now
    };
  }
}
