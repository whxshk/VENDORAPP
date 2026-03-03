import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../database/schemas/AuditLog.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FraudSignalsService {
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
    private auditService: AuditService,
  ) {}

  /**
   * Track scan activity (called after successful scan)
   */
  async trackScan(tenantId: string, deviceId: string | null, customerId: string) {
    // Store in audit log with metadata for tracking
    await this.auditService.log(
      tenantId,
      '',
      'SCAN_EXECUTED',
      'transaction',
      customerId,
      {
        deviceId,
        timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * Track redemption activity
   */
  async trackRedemption(tenantId: string, customerId: string, success: boolean) {
    await this.auditService.log(
      tenantId,
      '',
      success ? 'REDEMPTION_SUCCESS' : 'REDEMPTION_FAILED',
      'redemption',
      customerId,
      {
        timestamp: new Date().toISOString(),
      },
    );
  }

  /**
   * Get misuse signals for a tenant
   */
  async getMisuseSignals(tenantId: string, deviceId?: string, customerId?: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Scans per device per hour
    const scansLastHour = await this.auditModel.countDocuments({
      tenantId,
      action: 'SCAN_EXECUTED',
      createdAt: { $gte: oneHourAgo },
    }).exec();

    // Redemptions per customer per day
    const redemptionQuery: any = {
      tenantId,
      action: { $in: ['REDEMPTION_SUCCESS', 'REDEMPTION_FAILED'] },
      createdAt: { $gte: oneDayAgo },
    };
    if (customerId) {
      redemptionQuery.resourceId = customerId;
    }
    const redemptionsLastDay = await this.auditModel.countDocuments(redemptionQuery).exec();

    // Failed redemptions
    const failedQuery: any = {
      tenantId,
      action: 'REDEMPTION_FAILED',
      createdAt: { $gte: oneDayAgo },
    };
    if (customerId) {
      failedQuery.resourceId = customerId;
    }
    const failedRedemptions = await this.auditModel.countDocuments(failedQuery).exec();

    return {
      scansLastHour,
      redemptionsLastDay,
      failedRedemptionsLastDay: failedRedemptions,
      signals: this.evaluateSignals(scansLastHour, redemptionsLastDay, failedRedemptions),
    };
  }

  private evaluateSignals(scans: number, redemptions: number, failures: number) {
    const signals: string[] = [];

    if (scans > 100) {
      signals.push('HIGH_SCAN_VOLUME');
    }

    if (redemptions > 20) {
      signals.push('HIGH_REDEMPTION_VOLUME');
    }

    if (failures > 5) {
      signals.push('REPEATED_FAILED_REDEMPTIONS');
    }

    return signals;
  }
}
