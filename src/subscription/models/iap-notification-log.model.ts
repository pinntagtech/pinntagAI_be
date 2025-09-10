import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class IapNotificationLog extends Document {
  @Prop({ required: true, enum: ['google', 'apple'] })
  platform: 'google' | 'apple'; // Which platform sent the notification

  @Prop({ required: true })
  eventType: string; // Unified event type (e.g. "SUBSCRIPTION_PURCHASED", "DID_RENEW", etc.)

  @Prop({ required: true })
  productId: string; // Subscription or product identifier (SKU)

  @Prop()
  purchaseToken?: string; // Google purchase token (for subscriptions or one-time purchases)

  @Prop()
  originalTransactionId?: string; // Apple original transaction ID (for subscriptions)

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // Mapped user account (if resolved)

  @Prop({ required: true })
  eventTime: Date; // When the event occurred (from notification timestamp)

  @Prop()
  rawPayload?: string; // Raw notification payload (for full details/debugging)
}

export const IapNotificationLogSchema =
  SchemaFactory.createForClass(IapNotificationLog);
