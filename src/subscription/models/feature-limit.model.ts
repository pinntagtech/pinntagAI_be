import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class FeatureLimit extends Document {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'SubscriptionProduct',
    required: true,
  })
  product: mongoose.Types.ObjectId;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  value: string; // examples: "unlimited", "enabled", "5"
}

export const FeatureLimitSchema = SchemaFactory.createForClass(FeatureLimit);
