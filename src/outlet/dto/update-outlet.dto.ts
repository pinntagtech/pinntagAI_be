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

export class UpdateOutletDto {
  // Outlet Basic Information
  @IsOptional()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  type: string; // Dropdown based on category


  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  manager: string; // Reference to a User entity

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
  @IsString()
  postalCode: string;

  // Contact Information

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  // Social Media & Online Presence
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  googleMyBusinessId?: string;

  // /FOR PHYSICAL RETAIL AND OUTLET SERVICE OUTLETS

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  posSystemId?: string;



  // Mobile & Flexible Outlet Specific Fields
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: string;

  @IsOptional()
  @IsString()
  vehicleRegistrationNumber?: string;

  @IsOptional()
  @IsBoolean()
  gpsTrackerEnabled?: boolean;

  // Temporary & Event-Based Outlet Specific Fields
  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsString()
  boothNumber?: string;

  // Online & Delivery-Centric Outlet Specific Fields
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  partneredDeliveryServices?: string[];

  // Specialty & Unconventional Outlet Specific Fields
  @IsOptional()
  @IsBoolean()
  insidePremise?: boolean;

  @IsOptional()
  @IsString()
  premiseName?: string; // Name of Hotel, Airport, University, etc.
}
