import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DailyMetricRow = {
  date: string;
  activeCustomers: number;
  repeatCustomers: number;
  transactionsIssue: number;
  transactionsRedeem: number;
  redemptionRate: number;
  scanErrorsTotal: number;
};

type WeeklyAggregate = {
  activeCustomers: number;
  repeatCustomers: number;
  transactionsIssue: number;
  transactionsRedeem: number;
  transactionsAdjust: number;
  transactionsReverse: number;
  transactionsTotal: number;
  scanErrorsTotal: number;
};

@Injectable()
export class PilotReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get weekly pilot report for a merchant.
   * Uses pilot_daily_metrics when populated; otherwise derives from transactions + redemptions.
   */
  async getWeeklyReport(tenantId: string, week: string) {
    const [year, weekNum] = week.split('-').map(Number);
    const weekStart = this.getWeekStartDate(year, weekNum);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const dailyMetrics = await this.prisma.pilotDailyMetric.findMany({
      where: {
        tenantId,
        metricDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: {
        metricDate: 'asc',
      },
    });

    let daily: DailyMetricRow[];
    let weekly: WeeklyAggregate;
    let topRewards: Array<{ rewardId: string; rewardName: string; redemptionCount: number }>;

    if (dailyMetrics.length > 0) {
      // Use pilot metrics
      weekly = this.aggregateWeeklyFromDaily(dailyMetrics);
      topRewards = await this.getTopRewardsFromPilot(tenantId, weekStart, weekEnd);
      daily = dailyMetrics.map((m) => ({
        date: m.metricDate.toISOString().split('T')[0],
        activeCustomers: m.activeCustomers,
        repeatCustomers: m.repeatCustomers,
        transactionsIssue: m.transactionsIssue,
        transactionsRedeem: m.transactionsRedeem,
        redemptionRate: m.redemptionRate ? Number(m.redemptionRate) : 0,
        scanErrorsTotal: m.scanErrorsTotal,
      }));
    } else {
      // Fallback: derive from transactions + redemptions
      const { daily: dailyFromTx, weekly: weeklyFromTx } =
        await this.calculateDailyMetricsFromTransactions(tenantId, weekStart, weekEnd);
      daily = dailyFromTx;
      weekly = weeklyFromTx;
      topRewards = await this.getTopRewardsFromRedemptions(tenantId, weekStart, weekEnd);
    }

    const redemptionRate =
      weekly.transactionsIssue > 0
        ? Math.min(1, Number((weekly.transactionsRedeem / weekly.transactionsIssue).toFixed(4)))
        : 0;
    const daysWithData = daily.filter((d) => d.transactionsIssue + d.transactionsRedeem > 0).length;
    const summary = this.generateSummary(weekly, redemptionRate, daysWithData);

    return {
      week,
      period: {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
      },
      summary,
      metrics: {
        weekly,
        daily,
      },
      topRewards,
      retention: {
        repeatCustomerRate:
          weekly.activeCustomers > 0
            ? Number((weekly.repeatCustomers / weekly.activeCustomers).toFixed(4))
            : 0,
      },
      operationalFriction: {
        manualAdjustments: weekly.transactionsAdjust,
        reversals: weekly.transactionsReverse,
        errorRate:
          weekly.transactionsTotal > 0
            ? Number((weekly.scanErrorsTotal / weekly.transactionsTotal).toFixed(4))
            : 0,
      },
    };
  }

  private aggregateWeeklyFromDaily(
    dailyMetrics: Array<{
      activeCustomers: number;
      repeatCustomers: number;
      transactionsIssue: number;
      transactionsRedeem: number;
      transactionsAdjust: number;
      transactionsReverse: number;
      transactionsTotal: number;
      scanErrorsTotal: number;
    }>,
  ): WeeklyAggregate {
    return dailyMetrics.reduce<WeeklyAggregate>(
      (acc, day) => ({
        activeCustomers: Math.max(acc.activeCustomers, day.activeCustomers),
        repeatCustomers: Math.max(acc.repeatCustomers, day.repeatCustomers),
        transactionsIssue: acc.transactionsIssue + day.transactionsIssue,
        transactionsRedeem: acc.transactionsRedeem + day.transactionsRedeem,
        transactionsAdjust: acc.transactionsAdjust + day.transactionsAdjust,
        transactionsReverse: acc.transactionsReverse + day.transactionsReverse,
        transactionsTotal: acc.transactionsTotal + day.transactionsTotal,
        scanErrorsTotal: acc.scanErrorsTotal + day.scanErrorsTotal,
      }),
      {
        activeCustomers: 0,
        repeatCustomers: 0,
        transactionsIssue: 0,
        transactionsRedeem: 0,
        transactionsAdjust: 0,
        transactionsReverse: 0,
        transactionsTotal: 0,
        scanErrorsTotal: 0,
      },
    );
  }

  /**
   * Derive daily metrics from transactions when pilot_daily_metrics are empty.
   */
  private async calculateDailyMetricsFromTransactions(
    tenantId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<{ daily: DailyMetricRow[]; weekly: WeeklyAggregate }> {
    const weekEndEOD = new Date(weekEnd);
    weekEndEOD.setHours(23, 59, 59, 999);

    const txList = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        createdAt: {
          gte: weekStart,
          lte: weekEndEOD,
        },
      },
      select: {
        type: true,
        customerId: true,
        createdAt: true,
      },
    });

    const byDate = new Map<
      string,
      {
        issue: number;
        redeem: number;
        customerCounts: Map<string, number>;
      }
    >();
    const weekCustomerCounts = new Map<string, number>();

    const toDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    for (const tx of txList) {
      const dateStr = toDateStr(tx.createdAt);
      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, { issue: 0, redeem: 0, customerCounts: new Map() });
      }
      const row = byDate.get(dateStr)!;
      if (tx.type === 'ISSUE') row.issue += 1;
      else if (tx.type === 'REDEEM') row.redeem += 1;
      const c = (row.customerCounts.get(tx.customerId) ?? 0) + 1;
      row.customerCounts.set(tx.customerId, c);
      weekCustomerCounts.set(tx.customerId, (weekCustomerCounts.get(tx.customerId) ?? 0) + 1);
    }

    const daily: DailyMetricRow[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = toDateStr(d);
      const row = byDate.get(dateStr);
      const activeCustomers = row ? row.customerCounts.size : 0;
      const repeatCustomers = row
        ? [...row.customerCounts.values()].filter((n) => n > 1).length
        : 0;
      daily.push({
        date: dateStr,
        activeCustomers,
        repeatCustomers,
        transactionsIssue: row?.issue ?? 0,
        transactionsRedeem: row?.redeem ?? 0,
        redemptionRate: 0,
        scanErrorsTotal: 0,
      });
    }

    const weekly = daily.reduce<WeeklyAggregate>(
      (acc, day) => ({
        activeCustomers: Math.max(acc.activeCustomers, day.activeCustomers),
        repeatCustomers: Math.max(acc.repeatCustomers, day.repeatCustomers),
        transactionsIssue: acc.transactionsIssue + day.transactionsIssue,
        transactionsRedeem: acc.transactionsRedeem + day.transactionsRedeem,
        transactionsAdjust: acc.transactionsAdjust,
        transactionsReverse: acc.transactionsReverse,
        transactionsTotal: acc.transactionsTotal + day.transactionsIssue + day.transactionsRedeem,
        scanErrorsTotal: acc.scanErrorsTotal,
      }),
      {
        activeCustomers: 0,
        repeatCustomers: 0,
        transactionsIssue: 0,
        transactionsRedeem: 0,
        transactionsAdjust: 0,
        transactionsReverse: 0,
        transactionsTotal: 0,
        scanErrorsTotal: 0,
      },
    );
    // Use actual repeat count: customers with >1 tx in the week
    weekly.repeatCustomers = [...weekCustomerCounts.values()].filter((n) => n > 1).length;

    return { daily, weekly };
  }

  private async getTopRewardsFromPilot(
    tenantId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<Array<{ rewardId: string; rewardName: string; redemptionCount: number }>> {
    const rows = await this.prisma.pilotRewardUsage.findMany({
      where: {
        tenantId,
        metricDate: { gte: weekStart, lte: weekEnd },
      },
      include: { reward: true },
      orderBy: { redemptionCount: 'desc' },
      take: 5,
    });
    return rows.map((r) => ({
      rewardId: r.rewardId,
      rewardName: r.reward.name,
      redemptionCount: r.redemptionCount,
    }));
  }

  /**
   * Top rewards from redemptions when pilot_reward_usage is empty.
   */
  private async getTopRewardsFromRedemptions(
    tenantId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<Array<{ rewardId: string; rewardName: string; redemptionCount: number }>> {
    const weekEndEOD = new Date(weekEnd);
    weekEndEOD.setHours(23, 59, 59, 999);

    const redemptions = await this.prisma.redemption.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        OR: [
          { completedAt: { gte: weekStart, lte: weekEndEOD } },
          {
            completedAt: null,
            createdAt: { gte: weekStart, lte: weekEndEOD },
          },
        ],
      },
      select: { rewardId: true },
    });

    const byReward = new Map<string, number>();
    for (const r of redemptions) {
      byReward.set(r.rewardId, (byReward.get(r.rewardId) ?? 0) + 1);
    }

    const rewardIds = [...byReward.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    if (rewardIds.length === 0) return [];

    const rewards = await this.prisma.reward.findMany({
      where: { id: { in: rewardIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(rewards.map((r) => [r.id, r.name]));

    return rewardIds.map((rewardId) => ({
      rewardId,
      rewardName: nameById.get(rewardId) ?? 'Unknown',
      redemptionCount: byReward.get(rewardId) ?? 0,
    }));
  }

  /**
   * Get onboarding funnel metrics
   */
  async getOnboardingFunnel(tenantId: string) {
    const funnel = await this.prisma.pilotOnboardingFunnel.findUnique({
      where: { tenantId },
    });

    if (!funnel) {
      return null;
    }

    return {
      tenantId,
      milestones: {
        merchantSignup: funnel.merchantSignupAt?.toISOString() || null,
        firstLocation: funnel.firstLocationCreatedAt?.toISOString() || null,
        firstStaff: funnel.firstStaffInvitedAt?.toISOString() || null,
        firstDevice: funnel.firstDeviceRegisteredAt?.toISOString() || null,
        firstScan: funnel.firstScanAt?.toISOString() || null,
      },
      durations: {
        timeToLocationMinutes: funnel.timeToLocationMinutes,
        timeToStaffMinutes: funnel.timeToStaffMinutes,
        timeToDeviceMinutes: funnel.timeToDeviceMinutes,
        timeToFirstScanMinutes: funnel.timeToFirstScanMinutes,
      },
      completion: {
        hasLocation: !!funnel.firstLocationCreatedAt,
        hasStaff: !!funnel.firstStaffInvitedAt,
        hasDevice: !!funnel.firstDeviceRegisteredAt,
        hasFirstScan: !!funnel.firstScanAt,
        isComplete: !!funnel.firstScanAt,
      },
    };
  }

  private getWeekStartDate(year: number, week: number): Date {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    return ISOweekStart;
  }

  private generateSummary(
    weekly: {
      activeCustomers: number;
      repeatCustomers: number;
      transactionsIssue: number;
      transactionsRedeem: number;
      transactionsAdjust: number;
      transactionsReverse: number;
      transactionsTotal: number;
      scanErrorsTotal: number;
    },
    redemptionRate: number,
    daysWithData: number,
  ): { improved: string[]; needsFixing: string[] } {
    const improved: string[] = [];
    const needsFixing: string[] = [];

    // Active customers
    if (weekly.activeCustomers > 0) {
      improved.push(`${weekly.activeCustomers} active customers this week`);
    } else {
      needsFixing.push('No active customers yet - need to process first scan');
    }

    // Repeat customers
    if (weekly.repeatCustomers > 0) {
      improved.push(`${weekly.repeatCustomers} repeat customers (good retention signal)`);
    } else if (weekly.activeCustomers > 5) {
      needsFixing.push('Low repeat customer rate - consider improving engagement');
    }

    // Redemption rate
    if (redemptionRate > 0.3) {
      improved.push(`Strong redemption rate: ${(redemptionRate * 100).toFixed(1)}%`);
    } else if (weekly.transactionsIssue > 10 && redemptionRate < 0.1) {
      needsFixing.push(`Low redemption rate: ${(redemptionRate * 100).toFixed(1)}% - customers may not see value`);
    }

    // Transaction volume
    if (weekly.transactionsTotal > 50) {
      improved.push(`Strong transaction volume: ${weekly.transactionsTotal} transactions`);
    } else if (daysWithData > 3 && weekly.transactionsTotal < 10) {
      needsFixing.push('Low transaction volume - check if staff are using the system');
    }

    // Errors
    if (weekly.scanErrorsTotal > weekly.transactionsTotal * 0.1) {
      needsFixing.push(`High error rate: ${weekly.scanErrorsTotal} errors - check device setup and QR tokens`);
    }

    // Manual interventions
    if (weekly.transactionsAdjust + weekly.transactionsReverse > 5) {
      needsFixing.push(`${weekly.transactionsAdjust + weekly.transactionsReverse} manual adjustments/reversals - consider process improvements`);
    }

    if (improved.length === 0) {
      improved.push('Getting started - first week of operations');
    }

    return { improved, needsFixing };
  }
}
