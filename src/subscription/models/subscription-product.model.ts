import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { FeatureLimit } from './feature-limit.model';

@Schema({ timestamps: true })
export class SubscriptionProduct extends Document {
  @Prop({ required: true, unique: true })
  name: string; // e.g. "Pro", "Mobile", "Custom"

  @Prop()
  description?: string;

  @Prop({ required: false })
  stripeProductId?: string;

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
}

export const SubscriptionProductSchema =
  SchemaFactory.createForClass(SubscriptionProduct);
