import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ReceiptStatus } from 'src/enums/user.enum';

@Schema({ timestamps: true })
export class GooglePurchase extends Document {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Subscription', required: true })
  subscription: mongoose.Types.ObjectId; // The Subscription this purchase corresponds to

  @Prop({ required: true })
  purchaseToken: string; // Google Play purchaseToken for this subscription:contentReference[oaicite:14]{index=14}

  @Prop({ required: true })
  productId: string; // The subscription product ID (SKU) on Google Play

  @Prop()
  packageName?: string; // Package name of the app (if needed to verify or support multiple apps)

  @Prop()
  purchaseTime?: Date; // When the initial purchase was made (if available)

  @Prop()
  expiryTime?: Date; // When the subscription will/had expire(d) (milliseconds from Google converted to Date)

  @Prop({ enum: ReceiptStatus, default: ReceiptStatus.PENDING })
  status: ReceiptStatus; // Current receipt status (pending/valid/expired)

  @Prop()
  originalJson: string; // The full original JSON response from Google Play (stringified)

  @Prop()
  autoRenewing: boolean;

  @Prop()
  priceAmountMicros: number;

  @Prop()
  priceCurrencyCode: string;

  @Prop()
  paymentState: string;

  @Prop()
  lastNotificationType: string;
}
export const GooglePurchaseSchema =
  SchemaFactory.createForClass(GooglePurchase);
