import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuth2Dto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  profilePhoto: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  oAuthToken: string;

  @IsOptional()
  @IsString()
  fcmToken: string;

  @IsOptional()
  @IsString()
  deviceType: string;

  @IsOptional()
  @IsString()
  socialId: string;
}
