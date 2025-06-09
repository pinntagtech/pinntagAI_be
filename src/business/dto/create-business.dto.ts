import { Transform } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateBusinessDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  // @IsString()
  // registrationNumber:string;

  // @IsString()
  // registrationType:string;

  // @IsString()
  // bio:string;

  // @IsBoolean()
  // isRegistered: boolean;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  countryCode: string;

  @IsOptional()
  @IsString()
  website: string;

  @IsOptional()
  @IsString()
  roleOfCreator: string;

  @IsNotEmpty()
  @IsNumber()
  scalabilityFactor: number;

  // @IsString()
  // brand:string;

  // @IsString()
  // bio: string;
}
