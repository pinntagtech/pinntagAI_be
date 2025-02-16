import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { TransactionStatus } from 'src/enums/auth.enums';
import { Subscription } from 'src/subscription/models/subscription.model';

export type TransactionDocument = Transaction & Document;
@Schema({ timestamps: true })
export class Transaction {
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
  @Prop()
  startDate?: Date;
  @Prop()
  endDate?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
