import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ruleset, RulesetDocument } from '../database/schemas/Ruleset.schema';

const DEFAULT_POINTS_PER_CURRENCY = 0.5;

@Injectable()
export class RulesetsService {
  constructor(@InjectModel(Ruleset.name) private rulesetModel: Model<RulesetDocument>) {}

  async findAll(tenantId: string) {
    return this.rulesetModel.find({ tenantId }).exec();
  }

  async getPointsConversion(tenantId: string): Promise<number> {
    const now = new Date();
    const r = await this.rulesetModel
      .findOne({
        tenantId,
        ruleType: 'POINTS_PER_CURRENCY',
        effectiveFrom: { $lte: now },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
      })
      .sort({ effectiveFrom: -1 })
      .exec();
    if (!r?.config) return DEFAULT_POINTS_PER_CURRENCY;
    const v = (r.config as { pointsPerCurrency?: number }).pointsPerCurrency;
    return typeof v === 'number' && v > 0 ? v : DEFAULT_POINTS_PER_CURRENCY;
  }
}
