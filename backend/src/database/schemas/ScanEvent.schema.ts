import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ScanEventDocument = ScanEvent & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'scan_events' })
export class ScanEvent {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, index: true, type: String })
  tenantId!: string;

  @Prop({ required: true, type: String })
  customerId!: string;

  @Prop({ required: true, ref: 'User', type: String })
  staffUserId!: string;

  @Prop({ type: String })
  deviceId?: string;

  @Prop({ required: true, type: String })
  purpose!: string;

  @Prop({ type: MongooseSchema.Types.Decimal128 })
  amount?: number;

  @Prop({ type: String })
  rewardId?: string;

  @Prop({ required: true, type: String })
  status!: string;

  @Prop({ required: true, index: true, type: String })
  idempotencyKey!: string;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, any>;
}

export const ScanEventSchema = SchemaFactory.createForClass(ScanEvent);

ScanEventSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
ScanEventSchema.index({ tenantId: 1, createdAt: 1 });
ScanEventSchema.index({ customerId: 1, purpose: 1, createdAt: 1 });
