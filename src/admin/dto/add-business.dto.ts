import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
  IsArray,
} from 'class-validator';
import mongoose from 'mongoose';

export class AddBusinessDto {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  @Transform(({ value }) => value.trim())
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  @Matches(/[\W_]/, {
    message: 'Password must contain at least one special character',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  businessUserName: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  businessName: string;

  @IsEmail({}, { message: 'Invalid email address' })
  businessEmail: string;

  @IsString()
  phone: string;

  @IsString()
  countryCode: string;

  @IsString()
  website: string;

  @IsOptional()
  @IsString()
  roleOfCreator: string;

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
  zipCode: string;

  @IsOptional()
  @IsString()
  businessIndustry: string;

  @IsOptional()
  @IsArray()
  businessCategories: Array<string | mongoose.Types.ObjectId>;
}
