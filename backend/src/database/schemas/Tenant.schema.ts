import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

/**
 * GeoJSON Point used for geospatial ($near) queries.
 * coordinates = [longitude, latitude]  ← GeoJSON convention (lng first).
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

@Schema({ timestamps: true, collection: 'tenants' })
export class Tenant {
  @Prop({ required: true, type: String })
  _id!: string;

  @Prop({ required: true, type: String })
  name!: string;

  @Prop({ type: Object, default: {} })
  config!: Record<string, any>;

  /**
   * GeoJSON Point — populated automatically when the merchant saves their
   * address (via geocoding).  Sparse so tenants without coordinates are
   * excluded from the index.
   */
  @Prop({
    type: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
    required: false,
  })
  location?: GeoPoint;

  @Prop({ default: true, type: Boolean })
  isActive!: boolean;

  @Prop({ default: false, type: Boolean })
  hasCompletedOnboarding!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

TenantSchema.index({ createdAt: 1 });
TenantSchema.index({ isActive: 1 });
// Sparse 2dsphere index — only indexes tenants that have coordinates set.
TenantSchema.index({ location: '2dsphere' }, { sparse: true });
