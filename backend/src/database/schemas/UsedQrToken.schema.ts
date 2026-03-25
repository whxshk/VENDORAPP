import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsedQrTokenDocument = UsedQrToken & Document;

/**
 * Stores consumed QR token JTIs to enforce single-use.
 * MongoDB TTL index on expiresAt auto-deletes entries after token expiry,
 * so this collection stays small — one entry per scan, auto-pruned.
 *
 * The unique index on jti is the core replay-prevention mechanism.
 * If two simultaneous scan attempts arrive with the same jti, MongoDB
 * guarantees exactly one insert succeeds (duplicate key = 11000 error).
 */
@Schema({ collection: 'used_qr_tokens', timestamps: { createdAt: 'consumedAt', updatedAt: false } })
export class UsedQrToken {
  @Prop({ required: true, type: String })
  jti!: string;

  @Prop({ required: true, type: String })
  customerId!: string;

  consumedAt!: Date;

  /** Token's own expiry — TTL index deletes this document automatically */
  @Prop({ required: true, type: Date })
  expiresAt!: Date;
}

export const UsedQrTokenSchema = SchemaFactory.createForClass(UsedQrToken);

// Single-use enforcement: reject any second insert with the same jti
UsedQrTokenSchema.index({ jti: 1 }, { unique: true });

// Auto-delete expired entries so the collection never grows unbounded
UsedQrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
