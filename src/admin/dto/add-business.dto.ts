import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
  IsArray,
  Max,
  MaxLength,
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
  @Transform(({ value }) => value.trim())
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, {
    message: 'Name must be at most 20 characters long',
  })
  businessUserName: string;

  // @IsNotEmpty()
  // @IsString()
  // @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // @Matches(/[A-Z]/, {
  //   message: 'Password must contain at least one uppercase letter',
  // })
  // @Matches(/[a-z]/, {
  //   message: 'Password must contain at least one lowercase letter',
  // })
  // @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  // @Matches(/[\W_]/, {
  //   message: 'Password must contain at least one special character',
  // })
  // password: string;


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

  @IsOptional()
  @IsString()
  website: string;

  @IsOptional()
  @IsString()
  roleOfCreator: string;

  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city?: string;

  @IsString()
  state?: string;

  @IsString()
  country?: string;

  @IsString()
  zipCode: string;

  @IsString()
  businessIndustry: string;

  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsArray()
  @IsString({ each: true })
  businessCategories: string[];
}
