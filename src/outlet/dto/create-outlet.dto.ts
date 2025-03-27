import { IsNotEmpty, IsString, IsOptional, IsEnum, IsEmail, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { OutletCategory } from '../model/outletCategory.model';
import { VehicleType } from '@googlemaps/google-maps-services-js';

export class CreateOutletDto {
  // Outlet Basic Information
  @IsNotEmpty()
  category: string;;

  @IsNotEmpty()
  @IsString()
  type: string; // Dropdown based on category

  @IsNotEmpty()
  @IsString()
  refId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  manager?: string; // Reference to a User entity

  // Address Information (for Physical, Online & Specialty outlets)
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  // Contact Information
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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

  @IsOptional()
  @IsString()
  posSystemId?: string;

  // Mobile & Flexible Outlet Specific Fields
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

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
  eventLocation?: string;

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
