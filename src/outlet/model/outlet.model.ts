import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { OutletCategoryList, VehicleType } from '../outlet.enum';
import { Business } from 'src/business/model/business.model';
import { OutletCategory } from './outletCategory.model';
import { OutletType } from './outletType.model';
import { MobileSpots } from 'src/business/model/mobileSpots.model';
// import { OutletCategory, VehicleType } from '../outlet.enum';

export type OutletDocument = Outlet & Document;

class LocationType {
  type: {
    type: string;
  };
  coordinates: Array<number>;
}
class Hours {
  hour: number;
  minute: number;
}

@Schema({ timestamps: true })
export class Outlet {
  // @Prop({ required: true, ref: OutletCategory.name })
  // category: mongoose.Types.ObjectId;

  // @Prop({ required: true , ref: OutletType.name})
  // type: mongoose.Types.ObjectId; // Dropdown based on category

  @Prop({ enum: Object.values(OutletCategoryList) })
  category: string;

  @Prop({ default: false })
  isFromCrawler: boolean;

  @Prop()
  refId: string;

  @Prop()
  placeId: string;

  @Prop()
  name: string;

  @Prop({ ref: 'BusinessUser' })
  manager: mongoose.Types.ObjectId; // Dropdown reference to User entity

  @Prop({ ref: 'BusinessUser' })
  creator: mongoose.Types.ObjectId; // Dropdown reference to User entity

  @Prop({ ref: 'Business' })
  business: mongoose.Types.ObjectId; // Dropdown reference to Business entity

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
  postalCode?: string;

  @Prop()
  countryCode?: string;

  // Contact Information
  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ default: 60 })
  servingRadius: number;

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

  // Mobile & Flexible Outlet Specific Fields
  @Prop()
  vehicleType?: string;

  @Prop()
  vehicleRegistrationNumber?: string;

  @Prop()
  latitude: number;
  @Prop()
  longitude: number;
  @Prop()
  accuracy: number;
  @Prop()
  location: LocationType;
  @Prop()
  openingTime: Hours;
  @Prop()
  closingTime: Hours;
  @Prop({ default: false })
  isDeleted: boolean;
  @Prop()
  cover: string;
  @Prop({ ref: MobileSpots.name })
  spots: mongoose.Types.ObjectId[];
}

export const OutletSchema = SchemaFactory.createForClass(Outlet);
OutletSchema.index({ location: '2dsphere' });
