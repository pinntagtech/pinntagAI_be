import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { SignupMethod } from 'src/user/models/user.model';

export class SignupAuthDto {
  @IsString()
  @IsNotEmpty()
  @IsIn([SignupMethod.EMAIL, SignupMethod.PHONE])
  signupMethod: string;

  @ValidateIf((o) => o.signupMethod === SignupMethod.EMAIL)
  @IsEmail()
  @IsString()
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsNotEmpty()
  email?: string;

  @ValidateIf((o) => o.signupMethod === SignupMethod.PHONE)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ValidateIf((o) => o.signupMethod === SignupMethod.PHONE)
  @IsString()
  @IsNotEmpty()
  countryCode?: string;

  @IsOptional()
  @IsNumber()
  latitude: number;
  @IsOptional()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  fcmToken: string;

  @IsOptional()
  deviceType: string;
}
