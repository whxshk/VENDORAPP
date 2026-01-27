import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema({ timestamps: true, collection: 'locations' })
export class Location {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  address?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

LocationSchema.index({ tenantId: 1 });
LocationSchema.index({ isActive: 1 });
