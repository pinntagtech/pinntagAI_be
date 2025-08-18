import mongoose from 'mongoose';
import { SubscriptionServiceType } from './subscription.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class IapReceipt extends Document {
  @Prop({ required: true, enum: SubscriptionServiceType })
  platform: SubscriptionServiceType; // 'in-app-ios' or 'in-app-android'

  @Prop({ required: true })
  rawReceipt: string; // base64 or JSON blob

  @Prop({ required: true })
  subscriptionId: mongoose.Types.ObjectId; // link to Subscription

  @Prop({ required: false })
  latestTransactionId?: string;

  @Prop({ required: false })
  expirationDate?: Date;

  @Prop({ default: false })
  isValidated: boolean;

  @Prop()
  validationAttempts: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  validationResponse?: any;
}

export const IapReceiptSchema = SchemaFactory.createForClass(IapReceipt);
