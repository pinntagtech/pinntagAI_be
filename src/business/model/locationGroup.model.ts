
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Business } from './business.model';
import { BusinessUser } from './businessUser.model';
import { Outlet } from 'src/outlet/model/outlet.model';

@Schema({ timestamps: true })
export class LocationGroup {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ ref: Outlet.name })
  locations: mongoose.Types.ObjectId[];

  @Prop({ ref: Business.name })
  business: mongoose.Types.ObjectId;

  @Prop({ ref:BusinessUser.name })
  createdBy: mongoose.Types.ObjectId;
}

export type LocationGroupDocument = LocationGroup & Document;
export const LocationGroupSchema = SchemaFactory.createForClass(LocationGroup);
