import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_POINTS_PER_CURRENCY = 0.5;

@Injectable()
export class RulesetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.ruleset.findMany({ where: { tenantId } });
  }

  async getPointsConversion(tenantId: string): Promise<number> {
    const now = new Date();
    const r = await this.prisma.ruleset.findFirst({
      where: {
        tenantId,
        ruleType: 'POINTS_PER_CURRENCY',
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!r?.config) return DEFAULT_POINTS_PER_CURRENCY;
    const v = (r.config as { pointsPerCurrency?: number }).pointsPerCurrency;
    return typeof v === 'number' && v > 0 ? v : DEFAULT_POINTS_PER_CURRENCY;
  }
}
