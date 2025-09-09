import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTypes } from 'mongoose';
import { Subscription } from 'rxjs';

@Schema({ timestamps: true })
export class StripeEvent extends Document {
  @Prop({ required: true, unique: true })
  eventId: string; // Stripe Event ID (e.g. "evt_1AbcDef...") – unique

  @Prop({ required: true })
  type: string; // Stripe event type (e.g. "invoice.payment_succeeded", "customer.subscription.deleted")

  @Prop({ type: SchemaTypes.Mixed, required: true })
  data: any; // Raw event payload from Stripe (nested JSON object)

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Subscription' })
  subscription?: Subscription; // (Optional) Reference to Subscription if this event relates to one

  @Prop({ default: false })
  processed: boolean; // Whether our system has processed this event (to avoid dupes)
}
export const StripeEventSchema = SchemaFactory.createForClass(StripeEvent);
