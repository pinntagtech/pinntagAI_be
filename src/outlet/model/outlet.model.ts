import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { OutletCategoryList, VehicleType } from '../outlet.enum';
// import { OutletCategory, VehicleType } from '../outlet.enum';

export type OutletDocument = Outlet & Document;



@Schema({ timestamps: true })
export class Outlet {
  @Prop({ required: true })
  category: mongoose.Types.ObjectId;

  @Prop({ required: true })
  type: mongoose.Types.ObjectId; // Dropdown based on category

  @Prop({ required: true, unique: true })
  refId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ ref: 'Businessusers' })
  manager: mongoose.Types.ObjectId; // Dropdown reference to User entity

  @Prop({ref: 'Businessusers'})
  creator: mongoose.Types.ObjectId; // Dropdown reference to User entity

  // Address Information (for Physical, Online, and Specialty outlets)
  @Prop()
  addressLine1?: string;

  @Prop()
  addressLine2?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  country?: string;

  @Prop()
  postalCode?: string;

  @Prop()
  countryCode?: string;

  // Contact Information
  @Prop({ required: true })
  phone: string;

  @Prop()
  email?: string;

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
}

export const OutletSchema = SchemaFactory.createForClass(Outlet);
