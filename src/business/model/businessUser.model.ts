import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Business } from './business.model';

export type BusinessUserDocument = BusinessUser & Document;

@Schema({ timestamps: true })
export class BusinessUser {
  @Prop({ default: false })
  isDeleted: boolean;
  @Prop({
    required: true,
    enum: [0, 1, 2],
    default: 0,
  })
  status: number;
  @Prop({ ref: 'Role' })
  role: mongoose.Types.ObjectId;
  @Prop({ required: true, ref: 'BusinessUser' })
  createdBy: mongoose.Types.ObjectId;
  @Prop({
    default:
      'https://pinntagbucket.s3.amazonaws.com/defaults/business_avatar.png',
  })
  profilePhoto: string;
  @Prop({ required: true })
  name: string;
  @Prop()
  countryCode: string;
  @Prop()
  phone: string;
  @Prop()
  email: string;
  @Prop()
  password: string;
  @Prop({required:true,ref:Business.name})
  business:mongoose.Types.ObjectId;
}

export const BusinessUserSchema = SchemaFactory.createForClass(BusinessUser);
