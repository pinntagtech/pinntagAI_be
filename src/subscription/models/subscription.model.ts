import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { SubscriptionProduct } from './subscription-product.model';
import { SubscriptionSource, SubscriptionStatus } from 'src/enums/user.enum';

export enum SubscriptionServiceType {
  STRIPE = 'stripe',
  IN_APP = 'inApp',
}

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ enum: Object.values(SubscriptionSource), required: true })
  source: SubscriptionSource; // Subscription source: web Stripe, Apple IAP, Google Play

  @Prop({ required: true, ref: SubscriptionProduct.name })
  product: Types.ObjectId;

  @Prop({ ref: 'Business' })
  business: mongoose.Types.ObjectId;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  invoiceStartDate: Date;

  @Prop()
  invoiceEndDate: Date;

  @Prop({ default: false })
  isCancelled: boolean;

  @Prop({ ref: 'Transaction' })
  transaction: mongoose.Types.ObjectId;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop({ default: true })
  isTrialActive?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPrice', required: true })
  price: mongoose.Types.ObjectId;

  @Prop({
    enum: SubscriptionStatus,
    required: true,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus; // Current subscription status (active, canceled, etc.)

  @Prop()
  currentPeriodEnd?: Date; // When the current billing period ends (expiry date)

  @Prop()
  stripeCustomerId?: string; // Stripe Customer ID (if Stripe subscription)
}

export type SubscriptionDocument = Subscription & Document;
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
