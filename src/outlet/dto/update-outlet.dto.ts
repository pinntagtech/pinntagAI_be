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

export class UpdateOutletDto {
  @IsOptional()
  @IsString()
  category: string;

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

  @IsOptional()
  latitude: number;
  @IsOptional()
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  servingRadius: number;

  @IsOptional()
  @IsString()
  website?: string;

  @IsString()
  address1?: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: string;

  @IsOptional()
  openingTime: string;

  @IsOptional()
  closingTime: string;
}
