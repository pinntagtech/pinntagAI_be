import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { TransactionStatus } from 'src/enums/auth.enums';

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop()
  description: string;

  @Prop()
  amount: number;

  @Prop()
  currency: string;

  @Prop()
  quantity: number;

  @Prop({ ref: 'User' })
  user: mongoose.Types.ObjectId;

  @Prop({ ref: 'BusinessProfile' })
  businessProfile: mongoose.Types.ObjectId;

  @Prop({
    enum: [
      TransactionStatus.PENDING,
      TransactionStatus.SUCCESS,
      TransactionStatus.FAILED,
    ],
  })
  status: number;

  @Prop()
  transactionId: string;

  @Prop({ ref: 'Subscription' })
  subscription: mongoose.Types.ObjectId;

  @Prop()
  isForProrate: boolean;

  @Prop({ enum: ['stripe', 'apple', 'google'], required: true })
  provider: string; // Platform of the transaction: "stripe", "apple", or "google"

  @Prop({ default: Date.now })
  transactionDate: Date; // Date/time the transaction occurred (payment timestamp)

  @Prop({ default: true })
  success: boolean;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  stripeInvoiceId?: string; // Stripe Invoice ID (for Stripe transactions)

  @Prop({ type: mongoose.Types.ObjectId, ref: 'AppleReceipt' })
  appleReceipt?: mongoose.Types.ObjectId | any; // Reference to AppleReceipt (for Apple transactions)

  @Prop()
  appleTransactionId?: string; // The specific Apple transactionId for this payment (from receipt)

  @Prop({ type: mongoose.Types.ObjectId, ref: 'GooglePurchase' })
  googlePurchase?: mongoose.Types.ObjectId | any; // Reference to GooglePurchase (for Google transactions)

  @Prop()
  googleOrderId?: string; // Google Order ID of this transaction (if available)
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
