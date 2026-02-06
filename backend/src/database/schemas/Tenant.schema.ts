import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, type: String })
  name!: string;

  @Prop({ type: Object, default: {} })
  config!: Record<string, any>;

  @Prop({ default: true, type: Boolean })
  isActive!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.index({ createdAt: 1 });
TenantSchema.index({ isActive: 1 });
