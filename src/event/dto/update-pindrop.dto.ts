import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';
import mongoose from 'mongoose';
import { EventTypes } from 'src/enums/event.enums';

export class UpdatePinDropDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  title?: string;

  @IsOptional()
  categories?: any;


  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  promotionCode?: string;

  @IsOptional()
  @IsString()
  isFree?: any;

  @IsOptional()
  @ValidateIf((o) => o.isFree === false)
  @IsString()
  participationCost?: string;

  @IsOptional()
  targetGenders?: any;

  @IsOptional()
  minTargetAge?: any;

  @IsOptional()
  maxTargetAge?: any;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  termsAndConditions?: string;

  @IsOptional()
  bookingSite?: string;

  @IsOptional()
  existingFiles: string;
}
