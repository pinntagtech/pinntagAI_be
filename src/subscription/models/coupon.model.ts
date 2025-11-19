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

  @Prop()
  percentageOff: number;

  @Prop()
  amountOff: number;

  @Prop({ required: true, enum: ['once', 'repeating', 'forever'] })
  duration: string;

  @Prop()
  type: 'percent' | 'flat';

  @Prop()
  durationInMonths: number;

  @Prop({ ref: 'Business' })
  usedBy: Array<mongoose.Types.ObjectId>;

  @Prop({ default: false })
  isBlacklisted: boolean;

  @Prop({ enum: CouponType })
  couponType: string;

  @Prop()
  redeemBy: Date;

  @Prop()
  maxRedemptions: number;

  @Prop({default: 0})
  usedCount: number;

  @Prop({ ref: 'Admin' })
  createdBy: mongoose.Types.ObjectId;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
