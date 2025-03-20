import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateBusinessDto {
  @IsOptional()
  @IsString()
  businessUser?:string;

  @IsString()
  name: string;
  
  @IsEmail()
  email: string;

  @IsString()
  registrationNumber:string;
  
  @IsString()
  registrationType:string;
  
  @IsString()
  bio:string;


  @IsBoolean()
  isRegistered: boolean;

  @IsString()
  businessCategory: string;

  @IsString()
  businessIndustry: string;

  @IsString()
  phone: string;

  @IsString()
  countryCode: string;

  @IsString()
  website: string;

  @IsString()
  brand:string;

  // @IsString()
  // bio: string;

  // @IsString()
  // addressLine1: string;

  // @IsOptional()
  // @IsString()
  // addressLine2?: string;

  // @IsString()
  // city: string;

  // @IsString()
  // state: string;

  // @IsString()
  // country: string;

  // @IsOptional()
  // @IsBoolean()
  // acceptsReservations?: boolean;

  // @IsOptional()
  // @IsArray()
  // paymentMethods?: string[];

  // @IsOptional()
  // authorisedUser?: mongoose.Types.ObjectId;
}
