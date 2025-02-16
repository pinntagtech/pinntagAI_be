import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BusinessProfile } from './businessProfile.model';
import mongoose from 'mongoose';

export type BusinessLocationDocument = BusinessLocation & Document;
@Schema({ timestamps: true })
export class BusinessLocation {
  @Prop()
  referenceNumber: string;
  @Prop({ required: true, ref: 'businessProfiles' })
  businessProfile: mongoose.Types.ObjectId;
  @Prop()
  name: string;
  @Prop()
  latitude: number;
  @Prop()
  longitude: number;
  @Prop()
  accuracy: number;
  @Prop()
  address1: string;
  @Prop()
  address2: string;
  @Prop()
  city: string;
  @Prop()
  state: string;
  @Prop()
  zip: string;
  @Prop()
  website: string;
  @Prop()
  email: string;
  @Prop()
  phone: string;
}

export const BusinessLocationSchema = SchemaFactory.createForClass(BusinessLocation);