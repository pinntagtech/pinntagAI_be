import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginBusinessDto {

  @IsNotEmpty()
  @IsString()
  signupMethod: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsOptional()
  @IsString()
  phone:string;

  @IsOptional()
  @IsString()
  countryCode: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  fcmToken: string;

  @IsOptional()
  latitude: number;

  @IsOptional()
  longitude: number;

  @IsOptional()
  deviceType: string;
}
