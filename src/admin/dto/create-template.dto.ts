import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType, EventTypes } from 'src/enums/event.enums';
import mongoose from 'mongoose';

export class CreateTemplateDto {

  @IsNotEmpty()
  @IsEnum(EventTypes, {
    message: 'Invalid event type',
  })
  type: string;

  @IsEnum(DiscountType, { message: 'Invalid discount type' })
  discountType: string;

  @IsOptional()
  @IsString()
  discountValue?: string;

  @IsNotEmpty()
  contentCategories: any;

  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  // @IsNumber()
  // @Type(() => Number)
  // @Min(0)
  minTargetAge?: string;

  @IsOptional()
  // @IsNumber()
  // @Type(() => Number)
  // @Min(0)
  maxTargetAge?: string;

  @IsOptional()
  @IsString({ each: true })
  targetGenders: string[];

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  isFree: string;

  @IsOptional()
  @IsString()
  participationCost?: string;

  @IsOptional()
  termsApplied: string;

  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @IsMongoId()
  businessIndustry?: any;

  // @IsArray()
  // @IsMongoId({ each: true })
  businessCategories?: string[];

}
