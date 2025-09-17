import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from '../../user/models/user.model';
import { Document } from 'mongoose';

export type RefferalDocument = Refferal & mongoose.Document;
@Schema({ timestamps: true })
export class Refferal {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true, default: 20 })
  amount: number;

  @Prop({ required: true, ref: 'User' })
  user: mongoose.Types.ObjectId;

  @Prop({ ref: 'User' })
  usedBy: Array<mongoose.Types.ObjectId>;

  @Prop({ default: false })
  isBlacklisted: boolean;

  @Prop({ enum: Object.values(['promotion', 'coupon']) })
  refferalType: string;

  @Prop()
  expiresAt: Date;
}

export const RefferalSchema = SchemaFactory.createForClass(Refferal);
