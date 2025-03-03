import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthDto } from './create-auth.dto';
import { IsEmail, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {
  @IsEmail()
  @IsString()
  @Transform(({ value }) => value.toLowerCase().trim())
  email?: string;
  @IsString()
  phone?: string;
  @IsString()
  countryCode?: string;
}
