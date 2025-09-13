import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { SubscriptionProduct } from './subscription-product.model';
import { CurrencyTypes } from 'src/enums/user.enum';

export enum BillingInterval {
  ANNUAL = 'annual',
  MONTHLY = 'monthly',
}

@Schema({ timestamps: true })
export class SubscriptionPrice extends Document {
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, ref: SubscriptionProduct.name })
  product: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: BillingInterval })
  billingInterval: BillingInterval;

  @Prop({ required: true, default: CurrencyTypes.USD })
  currency: CurrencyTypes;

  @Prop()
  stripePriceId?: string;

  @Prop({ default: false })
  isCustom: boolean;

  @Prop({ required: true })
  price: number;

  @Prop({})
  appleProductId?: string; // Apple App Store product identifier (SKU):contentReference[oaicite:5]{index=5}

  @Prop({})
  googleProductId?: string; // Google Play subscription product ID (SKU)
}

export const SubscriptionPriceSchema =
  SchemaFactory.createForClass(SubscriptionPrice);
