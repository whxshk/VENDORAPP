import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CustomerBalanceDocument = CustomerBalance & Document;

@Schema({ timestamps: false, collection: 'customer_balances' })
export class CustomerBalance {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  customerId: string;

  @Prop({ default: 0, type: MongooseSchema.Types.Decimal128 })
  balance: number;

  @Prop({ default: Date.now, index: true })
  lastUpdatedAt: Date;
}

export const CustomerBalanceSchema = SchemaFactory.createForClass(CustomerBalance);

CustomerBalanceSchema.index({ tenantId: 1, customerId: 1 }, { unique: true });
CustomerBalanceSchema.index({ tenantId: 1 });
CustomerBalanceSchema.index({ customerId: 1 });
CustomerBalanceSchema.index({ lastUpdatedAt: 1 });
