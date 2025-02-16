import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Allergen,
  Insurance,
  Location,
  Menu,
  OpeningHours,
  TaxDetails,
} from '../models/types.model';

export class UpdateBusinessProfileDto {
  @IsOptional()
  @IsNumber()
  locationCount: number;

  @IsOptional()
  @IsArray()
  inAppPurchaseIds: Array<string>;

  @IsOptional()
  @IsString()
  subscriptionType: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  bio: string;

  @IsOptional()
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

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
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

  @IsOptional()
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
}
