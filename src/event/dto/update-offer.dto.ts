import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import mongoose from 'mongoose';
import { EventTypes } from 'src/enums/event.enums';

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  title?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsIn(Object.values(EventTypes))
  eventType?: string;

  @IsOptional()
  categories?: any;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  discountType?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  discountValue?: string;

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
  quantityLimit?: any;

  @IsOptional()
  // @IsArray()
  locations: Array<string> | Array<Location>;

  @IsOptional()
  tags?: any;

  @IsOptional()
  existingFields?: any;
}
