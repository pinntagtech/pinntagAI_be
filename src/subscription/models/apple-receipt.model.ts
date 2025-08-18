import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTypes } from 'mongoose';
import { Subscription } from 'rxjs';
import { ReceiptStatus } from 'src/enums/user.enum';

@Schema({ timestamps: true })
export class AppleReceipt extends Document {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Subscription', required: true })
  subscription: Subscription; // The Subscription this receipt corresponds to

  @Prop({ required: true })
  originalTransactionId: string; // Apple original_transaction_id for this subscription:contentReference[oaicite:9]{index=9}

  @Prop({ required: true })
  receiptData: string;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  latestReceiptInfo: any[]; // Array of receipt info objects (one per purchase/renewal):contentReference[oaicite:10]{index=10}

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  pendingRenewalInfo: any[]; // Array of pending renewal info objects (auto-renew status, etc.)

  @Prop({ enum: ReceiptStatus, default: ReceiptStatus.PENDING })
  status: ReceiptStatus; // Receipt validation status (pending/valid/expired/invalid)

  @Prop()
  appleStatusCode?: number; // (Optional) raw status code from Apple verifyReceipt (e.g. 0 = valid)

  @Prop()
  latestExpiryDate?: Date; // (Optional) the expiration date of the latest period (for convenience)

  @Prop()
  environment?: string; // "Sandbox" or "Production" environment as returned by Apple
}

export const AppleReceiptSchema = SchemaFactory.createForClass(AppleReceipt);
