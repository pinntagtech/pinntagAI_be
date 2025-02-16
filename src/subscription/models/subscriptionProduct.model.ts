import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum DurationType {
  MONTHLY = 'monthly',
  QUARTER = 'quarter',
  ANNUAL = 'annual',
}

export type SubscriptionProductDocument = SubscriptionProduct & Document;

@Schema({ timestamps: true })
export class SubscriptionProduct {
  @Prop({ required: true })
  name: string;
  @Prop()
  description: string;
  @Prop({ required: true })
  price: number;
  @Prop({
    enum: [DurationType.ANNUAL, DurationType.MONTHLY],
  })
  durationType: string;
  @Prop({ default: 0 })
  duration: number;
  @Prop()
  stripeProductId: string;
  @Prop()
  isRecommended: boolean;
}

export const SubscriptionProductSchema =
  SchemaFactory.createForClass(SubscriptionProduct);
