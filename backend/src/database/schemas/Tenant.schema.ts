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

  @Prop({ default: true, type: Boolean })
  isActive!: boolean;

  @Prop({ default: false, type: Boolean })
  hasCompletedOnboarding!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);

// GeoJSON Point field added directly to avoid Mongoose's type/GeoJSON keyword conflict.
// The @Prop decorator cannot reliably express a sub-document whose own property is
// also named "type" — adding it here is the standard Mongoose workaround.
// Cast to any because the TypeScript overloads for Schema.add() don't include
// dynamic field names outside the class definition.
(TenantSchema as any).add({
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] },
  },
});

TenantSchema.index({ createdAt: 1 });
TenantSchema.index({ isActive: 1 });
// Sparse so only geocoded tenants are indexed; existing records without location are unaffected.
TenantSchema.index({ location: '2dsphere' }, { sparse: true });
