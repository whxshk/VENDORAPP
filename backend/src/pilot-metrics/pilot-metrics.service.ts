import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PilotDailyMetric, PilotDailyMetricDocument } from '../database/schemas/PilotDailyMetric.schema';
import { PilotCustomerActivity, PilotCustomerActivityDocument } from '../database/schemas/PilotCustomerActivity.schema';
import { PilotRewardUsage, PilotRewardUsageDocument } from '../database/schemas/PilotRewardUsage.schema';
import { PilotOnboardingFunnel, PilotOnboardingFunnelDocument } from '../database/schemas/PilotOnboardingFunnel.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PilotMetricsService {
  constructor(
    @InjectModel(PilotDailyMetric.name) private dailyMetricModel: Model<PilotDailyMetricDocument>,
    @InjectModel(PilotCustomerActivity.name) private customerActivityModel: Model<PilotCustomerActivityDocument>,
    @InjectModel(PilotRewardUsage.name) private rewardUsageModel: Model<PilotRewardUsageDocument>,
    @InjectModel(PilotOnboardingFunnel.name) private onboardingFunnelModel: Model<PilotOnboardingFunnelDocument>,
  ) {}

  /**
   * Update daily metrics for a tenant/location
   */
  async updateDailyMetrics(
    tenantId: string,
    locationId: string | null,
    date: Date,
    updates: Partial<{
      activeCustomers: number;
      repeatCustomers: number;
      transactionsIssue: number;
      transactionsRedeem: number;
      transactionsAdjust: number;
      transactionsReverse: number;
      scanErrorsExpiredQr: number;
      scanErrorsInsufficientBalance: number;
      scanErrorsUnauthorizedDevice: number;
    }>,
  ) {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    // Use consistent value: null becomes undefined (MongoDB doesn't store null, uses undefined)
    const locationIdValue = locationId || undefined;

    const existing = await this.dailyMetricModel.findOne({
      tenantId,
      ...(locationIdValue !== undefined ? { locationId: locationIdValue } : { locationId: { $exists: false } }),
      metricDate: dateOnly,
    }).exec();

    const transactionsTotal = (updates.transactionsIssue || 0) + 
                            (updates.transactionsRedeem || 0) + 
                            (updates.transactionsAdjust || 0) + 
                            (updates.transactionsReverse || 0);
    const scanErrorsTotal = (updates.scanErrorsExpiredQr || 0) + 
                           (updates.scanErrorsInsufficientBalance || 0) + 
                           (updates.scanErrorsUnauthorizedDevice || 0);

    if (existing) {
      // Update existing document with increments
      const updateData: any = {};
      if (updates.activeCustomers !== undefined) {
        updateData.$inc = { ...updateData.$inc, activeCustomers: updates.activeCustomers };
      }
      if (updates.repeatCustomers !== undefined) {
        updateData.$inc = { ...updateData.$inc, repeatCustomers: updates.repeatCustomers };
      }
      if (updates.transactionsIssue !== undefined) {
        updateData.$inc = { ...updateData.$inc, transactionsIssue: updates.transactionsIssue };
      }
      if (updates.transactionsRedeem !== undefined) {
        updateData.$inc = { ...updateData.$inc, transactionsRedeem: updates.transactionsRedeem };
      }
      if (updates.transactionsAdjust !== undefined) {
        updateData.$inc = { ...updateData.$inc, transactionsAdjust: updates.transactionsAdjust };
      }
      if (updates.transactionsReverse !== undefined) {
        updateData.$inc = { ...updateData.$inc, transactionsReverse: updates.transactionsReverse };
      }
      if (updates.scanErrorsExpiredQr !== undefined) {
        updateData.$inc = { ...updateData.$inc, scanErrorsExpiredQr: updates.scanErrorsExpiredQr };
      }
      if (updates.scanErrorsInsufficientBalance !== undefined) {
        updateData.$inc = { ...updateData.$inc, scanErrorsInsufficientBalance: updates.scanErrorsInsufficientBalance };
      }
      if (updates.scanErrorsUnauthorizedDevice !== undefined) {
        updateData.$inc = { ...updateData.$inc, scanErrorsUnauthorizedDevice: updates.scanErrorsUnauthorizedDevice };
      }
      if (transactionsTotal > 0) {
        updateData.$inc = { ...updateData.$inc, transactionsTotal };
      }
      if (scanErrorsTotal > 0) {
        updateData.$inc = { ...updateData.$inc, scanErrorsTotal };
      }

      await this.dailyMetricModel.updateOne(
        { tenantId, ...(locationIdValue !== undefined ? { locationId: locationIdValue } : { locationId: { $exists: false } }), metricDate: dateOnly },
        updateData
      ).exec();
    } else {
      // Create new document
      await this.dailyMetricModel.findOneAndUpdate(
        { tenantId, ...(locationIdValue !== undefined ? { locationId: locationIdValue } : { locationId: { $exists: false } }), metricDate: dateOnly },
        {
          $setOnInsert: {
            _id: uuidv4(),
            tenantId,
            locationId: locationIdValue,
            metricDate: dateOnly,
            activeCustomers: updates.activeCustomers || 0,
            repeatCustomers: updates.repeatCustomers || 0,
            transactionsIssue: updates.transactionsIssue || 0,
            transactionsRedeem: updates.transactionsRedeem || 0,
            transactionsAdjust: updates.transactionsAdjust || 0,
            transactionsReverse: updates.transactionsReverse || 0,
            transactionsTotal,
            scanErrorsExpiredQr: updates.scanErrorsExpiredQr || 0,
            scanErrorsInsufficientBalance: updates.scanErrorsInsufficientBalance || 0,
            scanErrorsUnauthorizedDevice: updates.scanErrorsUnauthorizedDevice || 0,
            scanErrorsTotal,
          },
        },
        { upsert: true, new: true }
      ).exec();
    }
  }

  /**
   * Track customer activity
   */
  async trackCustomerActivity(tenantId: string, customerId: string, transactionDate: Date) {
    const existing = await this.customerActivityModel.findOne({
      tenantId,
      customerId,
    }).exec();

    if (existing) {
      await this.customerActivityModel.updateOne(
        { tenantId, customerId },
        {
          $set: { lastTransactionAt: transactionDate },
          $inc: { transactionCount: 1 },
          ...(transactionDate < new Date() && !existing.firstTransactionAt && { firstTransactionAt: transactionDate }),
        }
      ).exec();
    } else {
      await this.customerActivityModel.findOneAndUpdate(
        { tenantId, customerId },
        {
          $setOnInsert: {
            _id: uuidv4(),
            tenantId,
            customerId,
            firstTransactionAt: transactionDate,
            lastTransactionAt: transactionDate,
            transactionCount: 1,
          },
        },
        { upsert: true, new: true }
      ).exec();
    }
  }

  /**
   * Track reward usage
   */
  async trackRewardUsage(tenantId: string, rewardId: string, date: Date) {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const existing = await this.rewardUsageModel.findOne({
      tenantId,
      rewardId,
      metricDate: dateOnly,
    }).exec();

    if (existing) {
      await this.rewardUsageModel.updateOne(
        { tenantId, rewardId, metricDate: dateOnly },
        { $inc: { redemptionCount: 1 } }
      ).exec();
    } else {
      await this.rewardUsageModel.findOneAndUpdate(
        { tenantId, rewardId, metricDate: dateOnly },
        {
          $setOnInsert: {
            _id: uuidv4(),
            tenantId,
            rewardId,
            metricDate: dateOnly,
            redemptionCount: 1,
          },
        },
        { upsert: true, new: true }
      ).exec();
    }
  }

  /**
   * Track onboarding milestone
   */
  async trackOnboardingMilestone(
    tenantId: string,
    milestone: 'merchant_signup' | 'first_location' | 'first_staff' | 'first_device' | 'first_scan',
  ) {
    const now = new Date();
    const updateData: any = {};

    switch (milestone) {
      case 'merchant_signup':
        updateData.merchantSignupAt = now;
        break;
      case 'first_location':
        updateData.firstLocationCreatedAt = now;
        break;
      case 'first_staff':
        updateData.firstStaffInvitedAt = now;
        break;
      case 'first_device':
        updateData.firstDeviceRegisteredAt = now;
        break;
      case 'first_scan':
        updateData.firstScanAt = now;
        break;
    }

    const funnel = await this.onboardingFunnelModel.findOneAndUpdate(
      { tenantId },
      {
        $setOnInsert: {
          _id: uuidv4(),
          tenantId,
        },
        $set: updateData,
      },
      { upsert: true, new: true }
    ).exec();

    // Calculate durations
    if (funnel.merchantSignupAt) {
      const durations: any = {};
      
      if (funnel.firstLocationCreatedAt) {
        durations.timeToLocationMinutes = Math.floor(
          (funnel.firstLocationCreatedAt.getTime() - funnel.merchantSignupAt.getTime()) / 60000
        );
      }
      if (funnel.firstStaffInvitedAt) {
        durations.timeToStaffMinutes = Math.floor(
          (funnel.firstStaffInvitedAt.getTime() - funnel.merchantSignupAt.getTime()) / 60000
        );
      }
      if (funnel.firstDeviceRegisteredAt) {
        durations.timeToDeviceMinutes = Math.floor(
          (funnel.firstDeviceRegisteredAt.getTime() - funnel.merchantSignupAt.getTime()) / 60000
        );
      }
      if (funnel.firstScanAt) {
        durations.timeToFirstScanMinutes = Math.floor(
          (funnel.firstScanAt.getTime() - funnel.merchantSignupAt.getTime()) / 60000
        );
      }

      if (Object.keys(durations).length > 0) {
        await this.onboardingFunnelModel.updateOne(
          { tenantId },
          { $set: durations }
        ).exec();
      }
    }

    return funnel;
  }
}
