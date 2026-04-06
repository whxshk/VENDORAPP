import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  ISSUE = 'ISSUE',
  REDEEM = 'REDEEM',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, index: true, type: String })
  tenantId!: string;

  @Prop({ required: true, index: true, type: String })
  customerId!: string;

  @Prop({ required: true, enum: TransactionType, index: true, type: String })
  type!: TransactionType;

  @Prop({ required: true, type: MongooseSchema.Types.Decimal128 })
  amount!: number;

  @Prop({ default: TransactionStatus.PENDING, enum: TransactionStatus, index: true, type: String })
  status!: TransactionStatus;

  @Prop({ required: true, index: true, type: String })
  idempotencyKey!: string;

  @Prop({ index: true, type: String })
  deviceId?: string;

  @Prop({ type: String })
  merchantName?: string;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, any>;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
TransactionSchema.index({ tenantId: 1 });
TransactionSchema.index({ customerId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: 1 });
TransactionSchema.index({ idempotencyKey: 1 });
