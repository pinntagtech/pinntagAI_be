import { Transform } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateBusinessDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsEmail()
  email: string;

  // @IsString()
  // registrationNumber:string;

  // @IsString()
  // registrationType:string;

  // @IsString()
  // bio:string;

  // @IsBoolean()
  // isRegistered: boolean;

  @IsString()
  phone: string;

  @IsString()
  countryCode: string;

  @IsString()
  website: string;

  @IsOptional()
  @IsString()
  roleOfCreator: string;

  // @IsString()
  // brand:string;

  // @IsString()
  // bio: string;
}
