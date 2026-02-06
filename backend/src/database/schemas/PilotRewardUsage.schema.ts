import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PilotRewardUsageDocument = PilotRewardUsage & Document;

@Schema({ timestamps: true, collection: 'pilot_reward_usage' })
export class PilotRewardUsage {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, index: true, type: String })
  tenantId!: string;

  @Prop({ required: true, type: String })
  rewardId!: string;

  @Prop({ required: true, type: Date, index: true })
  metricDate!: Date;

  @Prop({ default: 0, type: Number })
  redemptionCount!: number;
}

export const PilotRewardUsageSchema = SchemaFactory.createForClass(PilotRewardUsage);

PilotRewardUsageSchema.index({ tenantId: 1, rewardId: 1, metricDate: 1 }, { unique: true });
PilotRewardUsageSchema.index({ tenantId: 1, metricDate: 1 });
