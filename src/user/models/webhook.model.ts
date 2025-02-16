import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookSnapshotDocument = WebhookSnapshot & Document;

@Schema({ timestamps: true })
export class WebhookSnapshot {
  @Prop({ type: Object })
  snapshot: Record<string, any>;
}

export const WebhookSnapshotSchema =
  SchemaFactory.createForClass(WebhookSnapshot);
