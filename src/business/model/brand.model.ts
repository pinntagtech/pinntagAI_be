import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true })
export class Brand {
  @Prop({ required: true, unique: true })
  name: string;
  @Prop()
  tagline: string;
  @Prop({ required: true, ref: 'Business' })
  businessId: mongoose.Types.ObjectId;
  @Prop({ ref: 'Industry' })
  industryId: mongoose.Types.ObjectId;
  @Prop({ required: true, unique: true })
  slug: string;
  @Prop()
  description: string;
  @Prop()
  establishedYear: number;
  @Prop({
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
  })
  status: string;
  @Prop()
  logoUrl: string;
  @Prop()
  bannerImageUrl: string;
  @Prop()
  slogan: string;
  @Prop()
  email: string;
  @Prop()
  phone: string;
  @Prop()
  websiteUrl: string;
  @Prop()
  eCommerceUrl: string;
  @Prop({ default: false })
  isRegisteredTrademark: boolean;
  @Prop()
  trademarks: string[];
  @Prop({ type: mongoose.Types.ObjectId, ref: 'Outlet' })
  outletIds: mongoose.Types.ObjectId[];
}

export const BrandSchema = SchemaFactory.createForClass(Brand);