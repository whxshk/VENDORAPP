import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RedemptionDocument = Redemption & Document;

export enum RedemptionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, collection: 'redemptions' })
export class Redemption {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true, index: true })
  rewardId: string;

  @Prop({ required: true, type: MongooseSchema.Types.Decimal128 })
  pointsDeducted: number;

  @Prop({ default: RedemptionStatus.PENDING, enum: RedemptionStatus, index: true })
  status: RedemptionStatus;

  @Prop({ required: true, index: true })
  idempotencyKey: string;

  @Prop()
  completedAt?: Date;
}

export const RedemptionSchema = SchemaFactory.createForClass(Redemption);

RedemptionSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
RedemptionSchema.index({ tenantId: 1 });
RedemptionSchema.index({ customerId: 1 });
RedemptionSchema.index({ rewardId: 1 });
RedemptionSchema.index({ status: 1 });
RedemptionSchema.index({ idempotencyKey: 1 });
