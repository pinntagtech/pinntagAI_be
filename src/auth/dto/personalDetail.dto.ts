import { Transform } from 'class-transformer';
import {
  IsDate,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Genders } from 'src/user/models/user.model';

export class PersonDetailDto {
  @IsOptional()
  @IsString()
  profilePhoto: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsDateString()
  dob: string;

  @IsOptional()
  @IsString()
  @IsIn([Genders.FEMALE, Genders.MALE, Genders.OTHER, Genders.RATHER_NOT_SAY])
  gender: string;

  // @IsOptional()
  // @IsString()
  // @Transform(({ value }) => value.toLowerCase())
  // @Transform(({ value }) => value.trim())
  // email: string;

  // @IsOptional()
  // @IsString()
  // phone: string;

  // @IsOptional()
  // @IsString()
  // countryCode: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Username must be at least 6 characters long' })
  userName: string;

  @IsOptional()
  @IsString()
  bio: string;
}
