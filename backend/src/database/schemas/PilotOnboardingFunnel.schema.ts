import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PilotOnboardingFunnelDocument = PilotOnboardingFunnel & Document;

@Schema({ timestamps: true, collection: 'pilot_onboarding_funnel' })
export class PilotOnboardingFunnel {
  @Prop({ required: true, type: String, unique: true })
  _id: string;

  @Prop({ required: true, unique: true, index: true })
  tenantId: string;

  @Prop({ type: Date })
  merchantSignupAt?: Date;

  @Prop({ type: Date })
  firstLocationCreatedAt?: Date;

  @Prop({ type: Date })
  firstStaffInvitedAt?: Date;

  @Prop({ type: Date })
  firstDeviceRegisteredAt?: Date;

  @Prop({ type: Date })
  firstScanAt?: Date;

  @Prop({ type: Number })
  timeToLocationMinutes?: number;

  @Prop({ type: Number })
  timeToStaffMinutes?: number;

  @Prop({ type: Number })
  timeToDeviceMinutes?: number;

  @Prop({ type: Number })
  timeToFirstScanMinutes?: number;
}

export const PilotOnboardingFunnelSchema = SchemaFactory.createForClass(PilotOnboardingFunnel);

PilotOnboardingFunnelSchema.index({ tenantId: 1 });
