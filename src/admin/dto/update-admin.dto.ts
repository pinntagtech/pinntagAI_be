import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import mongoose from 'mongoose';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  firstName: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  lastName: string;

  @IsOptional()
  @IsString()
  profilePhoto: string;

//   @IsNotEmpty()
//   @IsString()
//   @IsEmail()
//   @Transform(({ value }) => value.toLowerCase().trim())
//   email: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  countryCode: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  phone: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  password: string;

  @IsOptional()
  role: mongoose.Types.ObjectId;
}
