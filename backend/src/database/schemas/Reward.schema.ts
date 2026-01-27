import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RewardDocument = Reward & Document;

@Schema({ timestamps: true, collection: 'rewards' })
export class Reward {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: MongooseSchema.Types.Decimal128 })
  pointsRequired: number;

  @Prop()
  description?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

RewardSchema.index({ tenantId: 1 });
RewardSchema.index({ isActive: 1 });
