import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SubscriptionProduct } from './subscriptionProduct.model';
import { Transaction } from 'src/user/models/transaction.model';
import { SubscriptionServices } from 'src/enums/auth.enums';

export type SubscriptionDocument = Subscription & mongoose.Document;
@Schema({ timestamps: true })
export class Subscription {
  @Prop({ enum: SubscriptionServices })
  serviceType: string;
  @Prop({ required: true, ref: 'User' })
  user: mongoose.Types.ObjectId;
  @Prop({ required: true, ref: SubscriptionProduct.name })
  product: mongoose.Types.ObjectId;
  @Prop({ ref: 'BusinessProfile' })
  businessProfile: mongoose.Types.ObjectId;
  @Prop()
  startDate: Date;
  @Prop()
  endDate: Date;
  @Prop()
  invoiceStartDate: Date;
  @Prop()
  invoiceEndDate: Date;
  @Prop({ default: false })
  isCancelled: boolean;
  @Prop({ ref: Transaction.name })
  transaction: mongoose.Types.ObjectId;
  @Prop()
  stripeSubscriptionId?: string;
  @Prop({ required: true, enum: [0, 1, 2], default: 0 })
  status: number;
  @Prop({ default: true })
  isTrialActive?: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
