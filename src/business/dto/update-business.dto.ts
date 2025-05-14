import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessDto } from './create-business.dto';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsUrl,
  IsObject,
  IsPhoneNumber,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import mongoose from 'mongoose';

class TeamSizeDto {
  @IsNumber()
  min: number;

  @IsOptional()
  @IsNumber()
  max: number | null;
}
export class UpdateBusinessDto {
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsBoolean()
  continueJourney?: boolean;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  businessIndustry: string;

  @IsOptional()
  @IsArray()
  businessCategories: Array<string | mongoose.Types.ObjectId>;

  @IsOptional()
  @IsBoolean()
  isPhysicalType: boolean;

  @ValidateIf((o) => o.isPhysicalType === true)
  @IsNumber()
  physicalUnits: number;

  @IsOptional()
  @IsBoolean()
  isMobileType: boolean;

  @ValidateIf((o) => o.isMobileType === true)
  @IsNumber()
  mobileUnits: number;

  @IsOptional()
  @IsBoolean()
  isOnlineType: boolean;

  // @IsOptional()
  // @IsBoolean()
  // isRegistered?: boolean;

  // @IsOptional()
  // @IsString()
  // constitution: string;

  // @IsOptional()
  // @IsString()
  // documentNumber: string;

  // @IsOptional()
  // @IsString()
  // documentType: string;

  // @IsOptional()
  // @IsString()
  // businessCategory?: string;

  // @IsOptional()
  // @IsString()
  // businessIndustry?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TeamSizeDto)
  teamSize?: TeamSizeDto;

  @IsOptional()
  @IsString()
  cover?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  authorisedUser?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  boardMembers?: string[];

  @IsOptional()
  @IsString()
  creatorType?: string;

  @IsOptional()
  @IsString()
  creator?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  outlets?: string[];

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  // @IsPhoneNumber(null)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  website?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  addressLine3?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  county?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsNumber()
  followersCount?: number;

  @IsOptional()
  @IsNumber()
  followingCount?: number;

  @IsOptional()
  @IsNumber()
  foundationYear?: number;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsNumber()
  foodHygieneRating?: number;

  @IsOptional()
  @IsArray()
  menu?: any[];

  @IsOptional()
  @IsArray()
  allergenInformation?: any[];

  @IsOptional()
  @IsArray()
  openingHours?: any[];

  @IsOptional()
  @IsBoolean()
  acceptsReservations?: boolean;

  @IsOptional()
  @IsString()
  reservationPolicy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];

  @IsOptional()
  @IsArray()
  reviews?: any[];

  @IsOptional()
  @IsArray()
  promotions?: any[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  covidSafetyMeasures?: string[];

  @IsOptional()
  @IsBoolean()
  isWheelchairAccessible?: boolean;

  @IsOptional()
  @IsBoolean()
  isParkingAvailable?: boolean;

  @IsOptional()
  @IsString()
  sustainabilityEfforts?: string;

  @IsOptional()
  @IsObject()
  insuranceDetails?: any;

  @IsOptional()
  @IsObject()
  taxInformation?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  healthAndSafetyPolicies?: string[];

  @IsOptional()
  @IsBoolean()
  isFacebookConnected?: boolean;

  @IsOptional()
  @IsObject()
  facebookToken?: any;

  @IsOptional()
  facebookPageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isInstagramConnected?: boolean;

  @IsOptional()
  @IsObject()
  instagramToken?: any;

  @IsOptional()
  instagramPageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isXConnected?: boolean;

  @IsOptional()
  @IsObject()
  XToken?: any;

  @IsOptional()
  XPageUrl?: string;

  @IsOptional()
  @IsString()
  managerName?: string;

  @IsOptional()
  @IsEmail()
  managerEmail?: string;

  @IsOptional()
  // @IsPhoneNumber(null)
  managerPhone?: string;
}
