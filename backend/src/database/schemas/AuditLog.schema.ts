import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ index: true })
  tenantId?: string;

  @Prop({ index: true })
  userId?: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true, index: true })
  resourceType: string;

  @Prop({ index: true })
  resourceId?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ tenantId: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ createdAt: 1 });
