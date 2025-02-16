import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Menu,
  Allergen,
  Insurance,
  Location,
  OpeningHours,
  TaxDetails,
} from '../models/types.model';
import mongoose from 'mongoose';

export class SubscriptionData {
  serviceType: string;
  product: mongoose.Types.ObjectId | string;
  startDate: Date;
  endDate: Date;
  transaction: {
    amount: number;
    currency: string;
    transactionId: string;
  };
}

export class createBusinessProfileDto {
  @IsOptional()
  @IsString()
  subscriptionType: string;

  @IsOptional()
  @IsNumber()
  locationCount: number;

  @IsOptional()
  @IsString()
  profilePhoto: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  bio: string;

  @IsNotEmpty()
  @IsArray()
  locations: Location[];

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  // @IsNumber()
  phone: number;

  @IsOptional()
  @IsString()
  brandColor: string;

  @IsOptional()
  @IsString()
  // @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  website: string;

  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsNumber()
  postCode: number;

  @IsOptional()
  @IsNumber()
  foundationYear: number;

  // @IsOptional()
  // @IsString()
  // registrationNumber: string;

  @IsOptional()
  @IsString()
  vatNumber: string;

  // @IsOptional()
  // @IsString()
  // licenseNumber: string;

  @IsOptional()
  @IsNumber()
  foodHygieneRating: number;

  @IsOptional()
  @IsArray()
  menu: Menu[];

  @IsOptional()
  @IsArray()
  allergenInformation: Allergen[];

  @IsNotEmpty()
  @IsArray()
  openingHours: OpeningHours[];

  @IsOptional()
  @IsBoolean()
  acceptsReservations: boolean;

  @IsOptional()
  @IsString()
  reservationPolicy: string;

  @IsOptional()
  @IsArray()
  paymentMethods: string[];

  @IsOptional()
  @IsArray()
  covidSafetyMeasures: string[];

  @IsOptional()
  @IsBoolean()
  isWheelchairAccessible: boolean;

  @IsOptional()
  @IsString()
  sustainabilityEfforts: string;

  @IsOptional()
  @IsObject()
  insuranceDetails: Insurance;

  @IsOptional()
  @IsObject()
  taxInformation: TaxDetails;

  @IsOptional()
  @IsArray()
  healthAndSafetyPolicies: string[];

  @IsOptional()
  @IsArray()
  subscriptions: Array<SubscriptionData>;

  @IsOptional()
  facebookPageUrl: string;

  @IsOptional()
  instagramPageUrl: string;

  @IsOptional()
  twitterPageUrl: string;

  @IsOptional()
  logo: string;

  @IsOptional()
  managerName: string;

  @IsOptional()
  managerEmail: string;

  @IsOptional()
  managerPhone: string;
}
