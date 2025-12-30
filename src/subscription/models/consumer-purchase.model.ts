import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ConsumerPurchaseStatus {
  RESERVED = 'reserved',
  REQUIRES_PAYMENT = 'requires_payment',
  PAID = 'paid',
  REDEEMED = 'redeemed',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Schema({
  timestamps: true,
})
export class ConsumerPurchase extends Document {
  /* =======================
     CORE RELATIONS
     ======================= */

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  deal: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Business', required: true, index: true })
  business: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  consumer: Types.ObjectId;

  /* =======================
     STRIPE REFERENCES
     ======================= */

  @Prop({ type: String, index: true, unique: true, sparse: true })
  paymentIntentId?: string;

  @Prop({ type: String, index: true })
  chargeId?: string;

  @Prop({ type: String })
  stripeAccountId?: string; // connected account (business)

  /* =======================
     MONEY
     ======================= */

  @Prop({ required: true })
  amount: number; // smallest unit (cents/paise)

  @Prop({ required: true, lowercase: true })
  currency: string;

  @Prop()
  platformFeeAmount?: number;

  /* =======================
     STATUS
     ======================= */

  @Prop({
    type: String,
    enum: ConsumerPurchaseStatus,
    default: ConsumerPurchaseStatus.RESERVED,
    index: true,
  })
  status: ConsumerPurchaseStatus;
  /* =======================
     REDEMPTION
     ======================= */

  @Prop({ unique: true, sparse: true })
  redemptionCode?: string; // QR / short code

  @Prop()
  redeemedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  redeemedByStaffId?: Types.ObjectId;

  @Prop()
  redemptionLocationId?: Types.ObjectId;

  /* =======================
     FAILURE / REFUND
     ======================= */

  @Prop()
  failedAt?: Date;

  @Prop()
  refundedAt?: Date;

  @Prop()
  refundReason?: string;

  /* =======================
     SAFETY / AUDIT
     ======================= */

  @Prop({ type: Object })
  latestStripeSnapshot?: any; // store PI / Charge snapshot

  @Prop({ type: Object })
  metadata?: Record<string, any>; // extensible (POS, offline flags, etc.)

  /* =======================
     EXPIRY / TTL
     ======================= */

  @Prop({ index: true })
  expiresAt?: Date; // for reserved / unpaid purchases
}

export const ConsumerPurchaseSchema =
  SchemaFactory.createForClass(ConsumerPurchase);
