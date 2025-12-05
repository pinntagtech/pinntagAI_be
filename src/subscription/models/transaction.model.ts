import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { TransactionStatus } from 'src/enums/auth.enums';
import { SubscriptionSource } from 'src/enums/user.enum';

@Schema({ timestamps: true })
export class Transaction extends Document {
  // ─────────────────────────────────────────────────────────────
  // CORE IDENTIFIERS & RELATIONSHIPS
  // ─────────────────────────────────────────────────────────────
  @Prop()
  description: string;

  @Prop()
  transactionId: string;

  @Prop({ ref: 'User' })
  user: mongoose.Types.ObjectId;

  @Prop({ ref: 'Business' })
  business: mongoose.Types.ObjectId;

  @Prop({ ref: 'Subscription' })
  subscription: mongoose.Types.ObjectId;

  // ─────────────────────────────────────────────────────────────
  // STATUS / PLATFORM
  // ─────────────────────────────────────────────────────────────
  @Prop({
    enum: [
      TransactionStatus.PENDING,
      TransactionStatus.SUCCESS,
      TransactionStatus.FAILED,
    ],
  })
  status: number;

  @Prop({ default: true })
  success: boolean;

  @Prop({ enum: SubscriptionSource })
  platform: SubscriptionSource; // 'stripe' | 'apple' | 'google'

  // ─────────────────────────────────────────────────────────────
  // MONEY / QUANTITY
  // ─────────────────────────────────────────────────────────────
  @Prop()
  amount: number;

  @Prop()
  amountMinor: number; // Amount in minor units (e.g., cents)

  @Prop()
  currency: string;

  @Prop()
  quantity: number;

  @Prop()
  isForProrate: boolean;

  // ─────────────────────────────────────────────────────────────
  // DATES / TIMESTAMPS
  // ─────────────────────────────────────────────────────────────
  @Prop({ default: Date.now })
  transactionDate: Date; // Payment timestamp

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  purchaseDate?: Date;

  @Prop()
  processedAt: Date;

  // ─────────────────────────────────────────────────────────────
  // PRODUCT / EVENT TYPE METADATA
  // ─────────────────────────────────────────────────────────────
  @Prop()
  type: string; // e.g., INITIAL_BUY, SUBSCRIPTION_RENEWED, etc.

  @Prop()
  subtype?: string;

  @Prop()
  productId?: string;

  // ─────────────────────────────────────────────────────────────
  // ARTIFACTS / FILES
  // ─────────────────────────────────────────────────────────────
  @Prop()
  invoiceFileUrl?: string; // URL to the invoice PDF or receipt

  // ─────────────────────────────────────────────────────────────
  // CROSS-PLATFORM TOKENS / MISC
  // ─────────────────────────────────────────────────────────────
  @Prop()
  purchaseToken?: string; // Google purchaseToken or Stripe charge ID

  @Prop()
  notificationUUID?: string; // Apple notificationUUID

  // ─────────────────────────────────────────────────────────────
  // STRIPE-SPECIFIC
  // ─────────────────────────────────────────────────────────────
  @Prop()
  stripeInvoiceId?: string; // Stripe Invoice ID

  @Prop()
  stripeSubscriptionId: string; // Stripe Subscription ID

  @Prop({ type: mongoose.Schema.Types.Mixed })
  stripeLogs?: any; // Raw Stripe event data (for debugging)

  // ─────────────────────────────────────────────────────────────
  // APPLE-SPECIFIC
  // ─────────────────────────────────────────────────────────────
  @Prop({ type: mongoose.Types.ObjectId, ref: 'AppleReceipt' })
  appleReceipt?: mongoose.Types.ObjectId | any; // Reference to AppleReceipt

  @Prop()
  appleTransactionId?: string; // Apple transactionId for this payment

  // ─────────────────────────────────────────────────────────────
  // GOOGLE-SPECIFIC
  // ─────────────────────────────────────────────────────────────
  @Prop({ type: mongoose.Types.ObjectId, ref: 'GooglePurchase' })
  googlePurchase?: mongoose.Types.ObjectId | any; // Reference to GooglePurchase

  @Prop()
  googleOrderId?: string; // Google Order ID of this transaction

  @Prop()
  eventTime?: number; // Google event timestamp (ms)

  @Prop({ref: 'Coupon'})
  coupon?: mongoose.Types.ObjectId; // Applied coupon code, if any
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
