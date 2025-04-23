import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { OutletCategoryList, VehicleType } from '../outlet.enum';
import { Business } from 'src/business/model/business.model';
import { OutletCategory } from './outletCategory.model';
import { OutletType } from './outletType.model';
// import { OutletCategory, VehicleType } from '../outlet.enum';

export type OutletDocument = Outlet & Document;



@Schema({ timestamps: true })
export class Outlet {
  // @Prop({ required: true, ref: OutletCategory.name })
  // category: mongoose.Types.ObjectId;

  // @Prop({ required: true , ref: OutletType.name})
  // type: mongoose.Types.ObjectId; // Dropdown based on category

  @Prop({enum: Object.values(OutletCategoryList)})
  category: string;

  @Prop()
  refId: string;

  @Prop()
  name: string;

  @Prop({ ref: 'BusinessUser' })
  manager: mongoose.Types.ObjectId; // Dropdown reference to User entity

  @Prop({ref: 'BusinessUser'})
  creator: mongoose.Types.ObjectId; // Dropdown reference to User entity

  @Prop({ref: 'Business'})
  business:mongoose.Types.ObjectId; // Dropdown reference to Business entity

  // Address Information (for Physical, Online, and Specialty outlets)
  @Prop()
  address1?: string;

  @Prop()
  address2?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  country?: string;

  @Prop()
  zip?: string;

  @Prop({ required: true })
  countryCode?: string;

  // Contact Information
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  // Social Media & Online Presence
  @Prop()
  whatsappNumber?: string;

  @Prop()
  website?: string;

  @Prop()
  facebook?: string;

  @Prop()
  instagram?: string;

  @Prop()
  twitter?: string;

  @Prop()
  googleMyBusinessId?: string;

  @Prop()
  posSystemId?: string;

  // Mobile & Flexible Outlet Specific Fields
  @Prop()
  vehicleType?: VehicleType;

  @Prop()
  vehicleRegistrationNumber?: string;

  @Prop({ default: false })
  gpsTrackerEnabled?: boolean;

  // Temporary & Event-Based Outlets
  @Prop()
  eventName?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;


  @Prop()
  boothNumber?: string;

  // Online & Delivery-Centric Outlets
  @Prop({ type: [String] })
  partneredDeliveryServices?: string[];

  // Specialty & Unconventional Outlets
  @Prop({ default: false })
  insidePremise?: boolean;

  @Prop()
  premiseName?: string; // Name of Hotel, Airport, University, etc.

  @Prop()
  latitude: number;
  @Prop()
  longitude: number;
  @Prop()
  accuracy: number;
}

export const OutletSchema = SchemaFactory.createForClass(Outlet);
