import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Business } from './business.model';
import { OneToMany } from 'typeorm';
import { BusinessUserCreatorType } from '../enums/business.enum';

export type BusinessUserDocument = BusinessUser & Document;

@Schema({ timestamps: true })
export class BusinessUser {
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ ref: 'Role' })
  role: mongoose.Types.ObjectId;

  @Prop({ref: 'BusinessUser' })
  creator: mongoose.Types.ObjectId;

  @Prop({required:true,enum:Object.values(BusinessUserCreatorType)})
  creatorType:string;


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
  @Prop({default:false})
  isEmailVerified:boolean;
  @Prop()
  password: string;
  @Prop({ref:Business.name})
  business:mongoose.Types.ObjectId;

}

export const BusinessUserSchema = SchemaFactory.createForClass(BusinessUser);
