import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PilotDailyMetricDocument = PilotDailyMetric & Document;

@Schema({ timestamps: true, collection: 'pilot_daily_metrics' })
export class PilotDailyMetric {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ index: true })
  locationId?: string;

  @Prop({ required: true, type: Date, index: true })
  metricDate: Date;

  @Prop({ default: 0 })
  activeCustomers: number;

  @Prop({ default: 0 })
  repeatCustomers: number;

  @Prop({ default: 0 })
  transactionsIssue: number;

  @Prop({ default: 0 })
  transactionsRedeem: number;

  @Prop({ default: 0 })
  transactionsAdjust: number;

  @Prop({ default: 0 })
  transactionsReverse: number;

  @Prop({ default: 0 })
  transactionsTotal: number;

  @Prop({ type: MongooseSchema.Types.Decimal128 })
  redemptionRate?: number;

  @Prop({ type: MongooseSchema.Types.Decimal128 })
  avgTimeToRedeemHours?: number;

  @Prop({ default: 0 })
  scanErrorsExpiredQr: number;

  @Prop({ default: 0 })
  scanErrorsInsufficientBalance: number;

  @Prop({ default: 0 })
  scanErrorsUnauthorizedDevice: number;

  @Prop({ default: 0 })
  scanErrorsTotal: number;
}

export const PilotDailyMetricSchema = SchemaFactory.createForClass(PilotDailyMetric);

PilotDailyMetricSchema.index({ tenantId: 1, locationId: 1, metricDate: 1 }, { unique: true });
PilotDailyMetricSchema.index({ tenantId: 1, metricDate: 1 });
PilotDailyMetricSchema.index({ locationId: 1, metricDate: 1 });
