import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import {
  Allergen,
  Menu,
  OpeningHours,
  Insurance,
  Promotion,
  Review,
  TaxDetails,
} from './types.model';
import { BusinessLocation } from './businessLocation.model';
import { Subscription } from 'src/subscription/models/subscription.model';
import { Drive } from 'src/drive/models/drive.model';

export class SocialMediaTokenDetails {
  value: string;
  age: Date;
}
export type BusinessProfileDocument = BusinessProfile & Document;
@Schema({ timestamps: true })
export class BusinessProfile {
  @Prop({ default: false })
  isDeleted: boolean;
  @Prop({ required: true, default: BusinessProfile.name })
  profileType: string;
  @Prop()
  locationCount: number;
  @Prop({
    required: true,
    enum: [0, 1, 2],
    default: 0,
  })
  status: number;
  @Prop()
  subscriptionType: string;
  @Prop({ ref: Subscription.name })
  subscription: mongoose.Types.ObjectId;
  @Prop({ ref: Subscription.name })
  subscriptions: Array<mongoose.Types.ObjectId>;
  @Prop({ required: true, ref: 'User' })
  authorisedUser: mongoose.Types.ObjectId;
  @Prop({ ref: 'User' })
  staff: Array<mongoose.Types.ObjectId>;
  @Prop({ required: true, ref: 'User' })
  createdBy: mongoose.Types.ObjectId;
  @Prop({
    default:
      'https://pinntagbucket.s3.amazonaws.com/defaults/business_avatar.png',
  })
  profilePhoto: string;
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  bio: string;
  @Prop()
  brandColor: string;
  @Prop({ ref: BusinessLocation.name })
  locations: Array<mongoose.Types.ObjectId>;
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
  city: string;
  @Prop()
  state: string;
  @Prop()
  country: string;
  @Prop()
  postCode: number;
  @Prop({ default: 0 })
  followersCount: number;
  @Prop({ default: 0 })
  followingCount: number;
  @Prop()
  foundationYear: number;
  // @Prop()
  // registrationNumber: string; // Business registration number
  @Prop()
  vatNumber: string; // VAT registration number, if applicable
  // @Prop()
  // licenseNumber: string; // License number for serving alcohol
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
  isTwitterConnected: boolean;
  @Prop({ default: {} })
  twitterToken: SocialMediaTokenDetails;
  @Prop()
  twitterPageUrl: string;
  @Prop()
  logo: string;
  @Prop()
  managerName: string;
  @Prop()
  managerEmail: string;
  @Prop()
  managerPhone: string;
}

export const BusinessProfileSchema =
  SchemaFactory.createForClass(BusinessProfile);
