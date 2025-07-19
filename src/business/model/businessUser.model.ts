import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Business } from './business.model';
import { OneToMany } from 'typeorm';
import {
  BusinessUserCreatorType,
  ProfileStatus,
  ScalabilityFactor,
} from '../enums/business.enum';

export type BusinessUserDocument = BusinessUser & Document;

@Schema({ timestamps: true })
export class BusinessUser {
  @Prop({ default: false })
  isDeleted: boolean;
  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ ref: 'Role' })
  role: mongoose.Types.ObjectId[];

  @Prop({
    required: true,
    enum: Object.values(ProfileStatus),
    default: ProfileStatus.INITIATED,
  })
  status: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ ref: 'BusinessUser' })
  creator: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(BusinessUserCreatorType) })
  creatorType: string;

  @Prop({
    default:
      'https://pinntag-assets.s3.us-east-1.amazonaws.com/Defaults/Default+business+user.png',
  })
  profilePhoto: string;
  @Prop({ required: true })
  name: string;
  @Prop()
  countryCode: string;
  @Prop()
  phone: string;
  @Prop({ required: true, unique: true })
  email: string;
  @Prop({ default: false })
  isEmailVerified: boolean;
  @Prop()
  password: string;
  @Prop({ ref: Business.name })
  business: mongoose.Types.ObjectId[];

  @Prop({ ref: Business.name })
  selectedBusiness: mongoose.Types.ObjectId;

  @Prop()
  drive: mongoose.Types.ObjectId;
  @Prop({ default: false })
  forcePasswordReset: boolean;
  @Prop()
  assignedOutlets: mongoose.Types.ObjectId[];
}

export const BusinessUserSchema = SchemaFactory.createForClass(BusinessUser);
