import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum DiscountTypes {
  FLAT = 'flat',
  PERCENTAGE = 'percentage',
}
export type BonusCodeDocument = BonusCode & Document;
@Schema({ timestamps: true })
export class BonusCode {
  @Prop({ required: true })
  code: string;
  @Prop({
    required: true,
    enum: [DiscountTypes.FLAT, DiscountTypes.PERCENTAGE],
  })
  discountType: string;
  @Prop({ required: true })
  discount: number;
  @Prop({ required: true, default: true })
  active: boolean;
}

export const BonusCodeSchema = SchemaFactory.createForClass(BonusCode);
