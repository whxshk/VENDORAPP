import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerMerchantAccountDocument = CustomerMerchantAccount & Document;

@Schema({ timestamps: true, collection: 'customer_merchant_accounts' })
export class CustomerMerchantAccount {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, index: true, type: String })
  customerId!: string;

  @Prop({ required: true, index: true, type: String })
  tenantId!: string;

  @Prop({ type: String })
  merchantName?: string;

  @Prop({ default: 'ACTIVE', index: true, type: String })
  membershipStatus!: string;
}

export const CustomerMerchantAccountSchema = SchemaFactory.createForClass(CustomerMerchantAccount);

CustomerMerchantAccountSchema.index({ customerId: 1, tenantId: 1 }, { unique: true });
CustomerMerchantAccountSchema.index({ customerId: 1 });
CustomerMerchantAccountSchema.index({ tenantId: 1 });
CustomerMerchantAccountSchema.index({ membershipStatus: 1 });
