import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { FeatureLimit } from './feature-limit.model';


export const PricingModel = {
  FLAT: 'flat',
  PER_LOCATION: 'per_location',
}
@Schema({ timestamps: true })
export class SubscriptionProduct extends Document {
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, unique: true })
  name: string; // e.g. "Pro", "Mobile", "Custom"

  @Prop()
  description?: string;

  @Prop({ required: false })
  stripeProductId?: string;

  @Prop({ unique: true })
  appleProductId?: string; // Apple App Store product identifier (SKU):contentReference[oaicite:5]{index=5}

  @Prop({ unique: true })
  googleProductId?: string; // Google Play subscription product ID (SKU)

  @Prop({
    type: [mongoose.Types.ObjectId],
    default: [],
    ref: FeatureLimit.name,
  })
  features: mongoose.Types.ObjectId[];

  @Prop({ default: false })
  isCustom: boolean;

  @Prop({ ref: 'Admin' })
  createdBy: mongoose.Types.ObjectId; // Reference to User who created this product

  @Prop({
    type: [mongoose.Types.ObjectId],
    default: [],
    ref: 'SubscriptionPrice',
  })
  prices: mongoose.Types.ObjectId[]; // Array of SubscriptionPrice IDs

  @Prop({ default: false })
  isRecommended: boolean; // Whether this product is recommended

  @Prop({ default: false })
  isFree: boolean;

  @Prop()
  minLocations?: number;
  
  @Prop()
  maxLocations?: number;

  @Prop({ enum: Object.values(PricingModel)})
  pricingModel: string;
}

export const SubscriptionProductSchema =
  SchemaFactory.createForClass(SubscriptionProduct);
