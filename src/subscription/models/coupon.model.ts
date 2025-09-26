import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum CouponType {
  PROMOTION = 'promotion',
  COUPON = 'coupon',
}

@Schema({ timestamps: true })
export class Coupon extends Document {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true, default: 20 })
  amount: number;

  @Prop({ ref: 'User' })
  usedBy: Array<mongoose.Types.ObjectId>;

  @Prop({ default: false })
  isBlacklisted: boolean;

  @Prop({ enum: CouponType })
  couponType: string;

  @Prop()
  expiresAt: Date;

  @Prop()
  maxUses: number;

  @Prop({ ref: 'Admin' })
  createdBy: mongoose.Types.ObjectId;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
