import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateDownlineBusinessUserDto {
  @IsNotEmpty()
  @IsString()
  role: string;

  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  @Transform(({ value }) => value.trim())
  email: string;

  // @IsNotEmpty()
  // @IsString()
  // @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // @Matches(/[A-Z]/, {
  //   message: 'Password must contain at least one uppercase letter',
  // })
  // @Matches(/[a-z]/, {
  //   message: 'Password must contain at least one lowercase letter',
  // })
  // @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  // @Matches(/[\W_]/, {
  //   message: 'Password must contain at least one special character',
  // })
  // password: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  forcePasswordReset: boolean;

  @IsOptional()
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  countryCode: string;

  // @IsPhoneNumber(null)
  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  allowedNotificationTypes: Array<string>;
}
