import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export enum IapPlatform {
  GOOGLE = 'google',
  APPLE = 'apple',
}

@Schema({ timestamps: true })
export class IapNotificationLog extends Document {
  @Prop({ required: true, enum: IapPlatform })
  platform: IapPlatform; // Which platform sent the notification

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

  @Prop()
  notificationUUID?: string; // Apple notificationUUID (if available)

  @Prop()
  googleEventTimeMillis?: number; // Google event timestamp in milliseconds (if available)

  @Prop({ default: Date.now })
  processedAt: Date; // When we processed this notification

  @Prop({ type: mongoose.Schema.Types.Mixed })
  validationResponse?: any; // Response from Apple/Google validation (if applicable)

  @Prop()
  decodedValidationResponse?: any; // Decoded data from Apple/Google validation (if applicable)

  @Prop()
  receivedAt: Date; // When we received this notification
}

export const IapNotificationLogSchema =
  SchemaFactory.createForClass(IapNotificationLog);
