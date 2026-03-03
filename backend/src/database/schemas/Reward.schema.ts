import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RewardDocument = Reward & Document;

@Schema({ timestamps: true, collection: 'rewards' })
export class Reward {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, index: true, type: String })
  tenantId!: string;

  @Prop({ required: true, type: String })
  name!: string;

  @Prop({ required: false, type: MongooseSchema.Types.Decimal128 })
  pointsRequired?: number;

  @Prop({ type: String, enum: ['points', 'stamps'], default: 'points' })
  rewardType!: string;

  @Prop({ type: Number })
  stampsCost?: number;

  @Prop({ type: String })
  description?: string;

  @Prop({ default: true, index: true, type: Boolean })
  isActive!: boolean;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

RewardSchema.index({ tenantId: 1 });
RewardSchema.index({ isActive: 1 });
