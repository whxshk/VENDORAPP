import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RulesetDocument = Ruleset & Document;

@Schema({ timestamps: true, collection: 'rulesets' })
export class Ruleset {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true, index: true })
  ruleType: string;

  @Prop({ type: Object, default: {} })
  config: Record<string, any>;

  @Prop({ default: Date.now, index: true })
  effectiveFrom: Date;

  @Prop({ index: true })
  effectiveTo?: Date;
}

export const RulesetSchema = SchemaFactory.createForClass(Ruleset);

RulesetSchema.index({ tenantId: 1 });
RulesetSchema.index({ ruleType: 1 });
RulesetSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
