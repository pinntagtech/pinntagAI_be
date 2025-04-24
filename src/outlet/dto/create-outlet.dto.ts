import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsBoolean,
  IsDateString,
  IsArray,
} from 'class-validator';
import { OutletCategory } from '../model/outletCategory.model';
import { VehicleType } from '../outlet.enum';

export class CreateOutletDto {
  // Outlet Basic Information
  @IsNotEmpty()
  @IsString()
  category: string;

  // @IsOptional()
  // @IsString()
  // refId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  // @IsOptional()
  // @IsString()
  // manager: string; // Reference to a User entity

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  postalCode: string;

  // Contact Information

  @IsNotEmpty()
  @IsString()
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  // Social Media & Online Presence
  // @IsOptional()
  // @IsString()
  // whatsappNumber?: string;

  @IsOptional()
  @IsString()
  website?: string;

  // @IsOptional()
  // @IsString()
  // facebook?: string;

  // @IsOptional()
  // @IsString()
  // instagram?: string;

  // @IsOptional()
  // @IsString()
  // twitter?: string;

  // @IsOptional()
  // @IsString()
  // googleMyBusinessId?: string;

  // /FOR PHYSICAL RETAIL AND OUTLET SERVICE OUTLETS

  @IsString()
  address1?: string;

  @IsOptional()
  @IsString()
  address2?: string;

  // Mobile & Flexible Outlet Specific Fields
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: string;

  // @IsOptional()
  // @IsString()
  // vehicleRegistrationNumber?: string;

  // @IsOptional()
  // @IsBoolean()
  // gpsTrackerEnabled?: boolean;

}
