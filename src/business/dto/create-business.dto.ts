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
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  businessIndustry: string;

  @IsArray()
  businessCategories: Array<string | mongoose.Types.ObjectId>;

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

  // @IsString()
  // brand:string;

  // @IsString()
  // bio: string;
}
