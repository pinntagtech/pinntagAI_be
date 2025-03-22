import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SocialMediaTokenDetails } from 'src/business-profile/models/businessProfile.model';
import {
  Menu,
  Allergen,
  OpeningHours,
  Review,
  Promotion,
  Insurance,
  TaxDetails,
} from 'src/business-profile/models/types.model';
import { Outlet } from './outlet.model';
import { Brand } from './brand.model';

export type BusinessDocument = Business & Document;

@Schema({ timestamps: true })
export class Business {
  @Prop({ default: false })
  isDeleted: boolean;
  @Prop({
    required: true,
    enum: [0, 1, 2, 3],
    default: 0,
  })
  status: number;
  @Prop()
  logo: string;
  @Prop()
  isRegistered: boolean;

  @Prop()
  businessCategory: string;

  @Prop()
  businessIndustry: string;

  @Prop()
  cover: string;

  
  @Prop()
  constitution:string;
  
  @Prop()
  documentNumber: string;

  @Prop()
  documentType: string;



  @Prop({ ref: Brand.name })
  brand: mongoose.Types.ObjectId;

  @Prop({ ref: 'BusinessUser' })
  authorisedUser: mongoose.Types.ObjectId; //owner of the business

  @Prop({ ref: 'BusinessUser' })
  boardMembers: mongoose.Types.ObjectId[];

  @Prop({ enum: ['Admin', 'BusinessUser'] })
  creatorType: string;

  @Prop({ required: true, refPath: 'creatorType' })
  creator: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;
  @Prop()
  bio: string;
  @Prop({ ref: Outlet.name })
  outlets: Array<mongoose.Types.ObjectId>;
  @Prop()
  countryCode: string;
  @Prop()
  phone: string;
  @Prop()
  email: string;
  @Prop()
  website: string;
  @Prop()
  addressLine1: string;
  @Prop()
  addressLine2: string;
  @Prop()
  addressLine3: string;
  @Prop()
  city: string;
  @Prop()
  district: string;
  @Prop()
  state: string;
  @Prop()
  country: string;
  @Prop()
  county: string;
  @Prop()
  postCode: number;
  @Prop({ default: 0 })
  followersCount: number;
  @Prop({ default: 0 })
  followingCount: number;
  @Prop()
  foundationYear: number;
  @Prop()
  vatNumber: string; // VAT registration number, if applicable
  @Prop()
  foodHygieneRating: number; // Food Standards Agency (FSA) hygiene rating
  @Prop()
  menu: Menu[]; // Array of menu items with details
  @Prop()
  allergenInformation: Allergen[]; // Array of allergens present in the dishes
  @Prop()
  openingHours: OpeningHours[]; // Array of opening hours for each day
  @Prop()
  acceptsReservations: boolean; // Indicates if reservations are accepted
  @Prop()
  reservationPolicy: string; // Details about the reservation policy
  @Prop()
  paymentMethods: string[]; // Array of accepted payment methods
  @Prop()
  reviews: Review[]; // Array of customer reviews and ratings
  @Prop()
  promotions: Promotion[]; // Array of ongoing promotions or discounts
  @Prop()
  covidSafetyMeasures: string[]; // Array of COVID-19 safety measures in place
  @Prop()
  isWheelchairAccessible: boolean; // Indicates if the restaurant is wheelchair accessible
  @Prop()
  isParkingAvailable: boolean; // Indicates if parking is available
  @Prop()
  sustainabilityEfforts: string; // Details about sustainability and environmental responsibility
  @Prop()
  insuranceDetails: Insurance; // Details about public liability insurance
  @Prop({ type: TaxDetails })
  taxInformation: TaxDetails; // Details about tax compliance
  @Prop()
  healthAndSafetyPolicies: string[]; // Array of health and safety policies
  @Prop({ default: false })
  isFacebookConnected: boolean;
  @Prop({ default: {} })
  facebookToken: SocialMediaTokenDetails;
  @Prop()
  facebookPageUrl: string;
  @Prop({ default: false })
  isInstagramConnected: boolean;
  @Prop({ default: {} })
  instagramToken: SocialMediaTokenDetails;
  @Prop()
  instagramPageUrl: string;
  @Prop({ default: false })
  isXConnected: boolean;
  @Prop({ default: {} })
  XToken: SocialMediaTokenDetails;
  @Prop()
  XPageUrl: string;
  @Prop()
  managerName: string;
  @Prop()
  managerEmail: string;
  @Prop()
  managerPhone: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
