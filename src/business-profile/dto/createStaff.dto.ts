import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Genders } from 'src/user/models/user.model';

export class CreateStaffDto {
  @IsOptional()
  id: string;

  @IsOptional()
  alreadyExists: boolean;

  @IsOptional()
  // @IsString()
  profilePhoto: string;

  @IsOptional()
  // @IsString()
  firstName: string;

  @IsOptional()
  // @IsString()
  lastName: string;

  @IsOptional()
  // @IsString()
  // @IsEmail()
  email: string;

  @IsOptional()
  // @IsString()
  countryCode: string;

  @IsOptional()
  // @IsString()
  phone: string;

  @IsOptional()
  // @IsString()
  password: string;

  @IsOptional()
  // @IsString()
  // @IsIn([Genders.MALE, Genders.FEMALE, Genders.OTHER, Genders.RATHER_NOT_SAY])
  gender: string;

  @IsOptional()
  // @IsNumber()
  age: number;
}
