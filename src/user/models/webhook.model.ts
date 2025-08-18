import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type WebhookSnapshotDocument = WebhookSnapshot & Document;

@Schema({ timestamps: true })
export class WebhookSnapshot {
  @Prop({ required: true })
  source: string; // Source of the webhook (e.g., "Stripe", "Apple", "Google")

  @Prop({ required: true, type: Object })
  data: Record<string, any>; // Raw webhook payload data (stored as a JSON object)

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  createdBy?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  updatedBy?: mongoose.Types.ObjectId;
}

export const WebhookSnapshotSchema =
  SchemaFactory.createForClass(WebhookSnapshot);
