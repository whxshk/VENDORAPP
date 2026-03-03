import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PilotDailyMetricDocument = PilotDailyMetric & Document;

@Schema({ timestamps: true, collection: 'pilot_daily_metrics' })
export class PilotDailyMetric {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, index: true, type: String })
  tenantId!: string;

  @Prop({ index: true, type: String })
  locationId?: string;

  @Prop({ required: true, type: Date, index: true })
  metricDate!: Date;

  @Prop({ default: 0, type: Number })
  activeCustomers!: number;

  @Prop({ default: 0, type: Number })
  repeatCustomers!: number;

  @Prop({ default: 0, type: Number })
  transactionsIssue!: number;

  @Prop({ default: 0, type: Number })
  transactionsRedeem!: number;

  @Prop({ default: 0, type: Number })
  transactionsAdjust!: number;

  @Prop({ default: 0, type: Number })
  transactionsReverse!: number;

  @Prop({ default: 0, type: Number })
  transactionsTotal!: number;

  @Prop({ type: MongooseSchema.Types.Decimal128 })
  redemptionRate?: number;

  @Prop({ type: MongooseSchema.Types.Decimal128 })
  avgTimeToRedeemHours?: number;

  @Prop({ default: 0, type: Number })
  scanErrorsExpiredQr!: number;

  @Prop({ default: 0, type: Number })
  scanErrorsInsufficientBalance!: number;

  @Prop({ default: 0, type: Number })
  scanErrorsUnauthorizedDevice!: number;

  @Prop({ default: 0, type: Number })
  scanErrorsTotal!: number;
}

export const PilotDailyMetricSchema = SchemaFactory.createForClass(PilotDailyMetric);

PilotDailyMetricSchema.index({ tenantId: 1, locationId: 1, metricDate: 1 }, { unique: true });
PilotDailyMetricSchema.index({ tenantId: 1, metricDate: 1 });
PilotDailyMetricSchema.index({ locationId: 1, metricDate: 1 });
