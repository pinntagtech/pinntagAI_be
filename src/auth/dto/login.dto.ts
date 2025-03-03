import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

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
