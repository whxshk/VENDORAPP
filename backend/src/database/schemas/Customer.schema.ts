import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true, collection: 'customers' })
export class Customer {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true })
  qrTokenSecret: string;

  @Prop({ default: 30 })
  rotationIntervalSec: number;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ createdAt: 1 });
