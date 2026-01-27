import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PilotCustomerActivityDocument = PilotCustomerActivity & Document;

@Schema({ timestamps: true, collection: 'pilot_customer_activity' })
export class PilotCustomerActivity {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ type: Date })
  firstTransactionAt?: Date;

  @Prop({ type: Date, index: true })
  lastTransactionAt?: Date;

  @Prop({ default: 0 })
  transactionCount: number;
}

export const PilotCustomerActivitySchema = SchemaFactory.createForClass(PilotCustomerActivity);

PilotCustomerActivitySchema.index({ tenantId: 1, customerId: 1 }, { unique: true });
PilotCustomerActivitySchema.index({ tenantId: 1 });
PilotCustomerActivitySchema.index({ customerId: 1 });
PilotCustomerActivitySchema.index({ tenantId: 1, lastTransactionAt: 1 });
