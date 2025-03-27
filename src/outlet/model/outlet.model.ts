import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BusinessUser } from 'src/business/model/businessUser.model';

export type OutletDocument = Outlet & Document;

enum OutletCategory {
  PHYSICAL = 'Physical Retail & Service Outlets',
  MOBILE = 'Mobile & Flexible Outlets',
  TEMPORARY = 'Temporary & Event-Based Outlets',
  ONLINE = 'Online & Delivery-Centric Outlets',
  SPECIALTY = 'Specialty & Unconventional Outlets',
}

enum VehicleType {
  TRUCK = 'Truck',
  VAN = 'Van',
  CART = 'Cart',
  BICYCLE = 'Bicycle',
  SCOOTER = 'Scooter',
}

@Schema({ timestamps: true })
export class Outlet {
  @Prop({ required: true, enum: OutletCategory })
  category: OutletCategory;

  @Prop({ required: true })
  type: string; // Dropdown based on category

  @Prop({ required: true, unique: true })
  refId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ ref: 'Businessusers' })
  manager: string; // Dropdown reference to User entity

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

  // Contact Information
  @Prop({ required: true })
  phoneNumber: string;

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
  eventLocation?: string;

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
