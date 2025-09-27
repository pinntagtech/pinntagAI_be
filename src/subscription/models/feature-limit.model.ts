import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum FeatureLimitList {
  AI_IMAGE = 'aiImage',
  AI_TEXT = 'aiText',
  CONTENT_CREATION = 'contentCreation',
  DROP_PIN = 'dropPinn',
  LOCATIONS = 'locations',
  TEMPLATES = 'templates',
  ANALYTICS = 'analytics',
  REGIONS = 'regions',
  ROLES = 'roles',
  DEPARTMENT = 'departments',
  STORAGE = 'storage',
}

@Schema({ timestamps: true })
export class FeatureLimit extends Document {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'SubscriptionProduct',
    required: true,
  })
  product: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(FeatureLimitList) })
  key: string;

  @Prop({ required: true })
  value: string; // examples: "unlimited", "enabled", "5"
}

export const FeatureLimitSchema = SchemaFactory.createForClass(FeatureLimit);
