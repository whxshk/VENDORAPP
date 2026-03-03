import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DeviceDocument = Device & Document;

@Schema({ timestamps: { createdAt: 'registeredAt', updatedAt: 'updatedAt' }, collection: 'devices' })
export class Device {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, index: true, type: String })
  tenantId!: string;

  @Prop({ index: true, type: String })
  locationId?: string;

  @Prop({ required: true, type: String })
  deviceIdentifier!: string;

  @Prop({ type: String })
  registeredByUserId?: string;

  @Prop({ default: true, index: true, type: Boolean })
  isActive!: boolean;

  registeredAt?: Date;
  updatedAt?: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.index({ tenantId: 1, deviceIdentifier: 1 }, { unique: true });
DeviceSchema.index({ tenantId: 1 });
DeviceSchema.index({ locationId: 1 });
DeviceSchema.index({ isActive: 1 });
DeviceSchema.index({ deviceIdentifier: 1 });
