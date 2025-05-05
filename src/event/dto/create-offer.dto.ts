import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateOfferDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  title: string;

  @IsNotEmpty()
  categories: any;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  discountType: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  discountValue: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  promotionCode: string;

  @IsString()
  isFree: any;

  @ValidateIf((o) => o.isFree === false)
  @IsString()
  participationCost: string;

  @IsOptional()
  @IsString()
//   @Transform(({ value }) => value.map((v) => v.trim()))
  targetGenders: any;

  @IsOptional()
  @IsString()
  minTargetAge: any;

  @IsOptional()
  @IsString()
  maxTargetAge: any;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  termsAndConditions: string;
}
