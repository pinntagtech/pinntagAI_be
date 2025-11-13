import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsBoolean,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { OutletCategory } from '../model/outletCategory.model';
import { VehicleType } from '../outlet.enum';
import { PartialType } from '@nestjs/mapped-types';

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
  @IsString()
  email: string;

  @IsNotEmpty()
  latitude: number;
  @IsNotEmpty()
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  servingRadius: number;

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

  @IsOptional()
  openingTime: string;

  @IsOptional()
  closingTime: string;

  // @IsOptional()
  // @IsString()
  // vehicleRegistrationNumber?: string;

  // @IsOptional()
  // @IsBoolean()
  // gpsTrackerEnabled?: boolean;
}
export class CreateOutletDtoV2 {

  // @IsOptional()
  // @IsString()
  // refId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

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
  @IsString()
  email: string;

  @IsNotEmpty()
  latitude: number;
  @IsNotEmpty()
  longitude: number;

  @IsOptional()
  @IsString()
  @Min(0)
  @Max(100)
  servingRadius: number;

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
  @IsNotEmpty()
  @IsEnum(VehicleType)
  vehicleType: string;

  @IsOptional()
  openingTime: string;

  @IsOptional()
  closingTime: string;

  // @IsOptional()
  // @IsString()
  // vehicleRegistrationNumber?: string;

  // @IsOptional()
  // @IsBoolean()
  // gpsTrackerEnabled?: boolean;
}
export class UpdateMobileOutletDto extends PartialType(CreateOutletDtoV2){}
export class CreateOutletByAdminDto {
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

  // @IsNotEmpty()
  // latitude: number;
  // @IsNotEmpty()
  // longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(90)
  servingRadius: number;

  @IsOptional()
  @IsString()
  website?: string;

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
