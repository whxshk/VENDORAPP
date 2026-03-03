import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OutboxEventDocument = OutboxEvent & Document;

export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'outbox_events' })
export class OutboxEvent {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, index: true, type: String })
  tenantId!: string;

  @Prop({ required: true, type: String })
  eventType!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, any>;

  @Prop({ default: OutboxEventStatus.PENDING, enum: OutboxEventStatus, index: true, type: String })
  status!: OutboxEventStatus;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ default: 0, type: Number })
  retryCount!: number;
}

export const OutboxEventSchema = SchemaFactory.createForClass(OutboxEvent);

OutboxEventSchema.index({ tenantId: 1 });
OutboxEventSchema.index({ status: 1 });
OutboxEventSchema.index({ createdAt: 1 });
OutboxEventSchema.index({ status: 1, createdAt: 1 });
