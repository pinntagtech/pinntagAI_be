import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateSpotDto {
  @IsNotEmpty()
  @IsString()
  name: string;

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

  @IsString()
  address1: string;

  @IsOptional()
  @IsString()
  address2?: string;
}
