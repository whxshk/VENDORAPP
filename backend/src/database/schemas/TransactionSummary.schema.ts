import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { TransactionType } from './Transaction.schema';

export type TransactionSummaryDocument = TransactionSummary & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'transaction_summaries' })
export class TransactionSummary {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, unique: true, index: true })
  transactionId: string;

  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true, type: Date, index: true })
  transactionDate: Date;

  @Prop({ required: true, type: MongooseSchema.Types.Decimal128 })
  amount: number;

  @Prop({ required: true, enum: TransactionType, index: true })
  type: TransactionType;
}

export const TransactionSummarySchema = SchemaFactory.createForClass(TransactionSummary);

TransactionSummarySchema.index({ tenantId: 1 });
TransactionSummarySchema.index({ customerId: 1 });
TransactionSummarySchema.index({ transactionDate: 1 });
TransactionSummarySchema.index({ type: 1 });
