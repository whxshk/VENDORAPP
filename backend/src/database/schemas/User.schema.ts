import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, index: true, type: String })
  tenantId!: string;

  @Prop({ index: true, type: String })
  customerId?: string;

  @Prop({ required: true, type: String })
  email!: string;

  @Prop({ type: String })
  name?: string;

  @Prop({ required: true, type: String })
  hashedPassword!: string;

  @Prop({ type: [String], default: [] })
  roles!: string[];

  @Prop({ type: [String], default: [] })
  scopes!: string[];

  @Prop({ default: true, index: true, type: Boolean })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ customerId: 1 });
