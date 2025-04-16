import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Business } from './business.model';
import { OneToMany } from 'typeorm';
import { BusinessUserCreatorType, ProfileStatus, ScalabilityFactor } from '../enums/business.enum';

export type BusinessUserDocument = BusinessUser & Document;

@Schema({ timestamps: true })
export class BusinessUser {
  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ ref: 'Role' })
  role: mongoose.Types.ObjectId[];

  @Prop({
    required: true,
    enum: Object.values(ProfileStatus),
    default: 0,
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
      'https://pinntagbucket.s3.us-east-1.amazonaws.com/business_avatar.png',
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

  @Prop({ref: Business.name})
  selectedBusiness: mongoose.Types.ObjectId;

  @Prop()
  drive: mongoose.Types.ObjectId;
  @Prop({ default: false })
  forcePasswordReset: boolean;
  @Prop()
  outlets: mongoose.Types.ObjectId[];
  @Prop({ default: 0, enum: Object.values(ScalabilityFactor) })
  scalabilityFactor: number;
}

export const BusinessUserSchema = SchemaFactory.createForClass(BusinessUser);
