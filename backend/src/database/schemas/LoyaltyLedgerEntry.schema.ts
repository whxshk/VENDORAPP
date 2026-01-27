import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LoyaltyLedgerEntryDocument = LoyaltyLedgerEntry & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'loyalty_ledger_entries' })
export class LoyaltyLedgerEntry {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  transactionId: string;

  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ required: true, type: MongooseSchema.Types.Decimal128 })
  amount: number;

  @Prop({ required: true, type: MongooseSchema.Types.Decimal128 })
  balanceAfter: number;

  @Prop({ required: true })
  idempotencyKey: string;

  @Prop({ required: true })
  operationType: string;
}

export const LoyaltyLedgerEntrySchema = SchemaFactory.createForClass(LoyaltyLedgerEntry);

LoyaltyLedgerEntrySchema.index({ tenantId: 1, idempotencyKey: 1, operationType: 1 }, { unique: true });
LoyaltyLedgerEntrySchema.index({ tenantId: 1 });
LoyaltyLedgerEntrySchema.index({ transactionId: 1 });
LoyaltyLedgerEntrySchema.index({ customerId: 1 });
LoyaltyLedgerEntrySchema.index({ createdAt: 1 });
LoyaltyLedgerEntrySchema.index({ tenantId: 1, customerId: 1, createdAt: 1 });
