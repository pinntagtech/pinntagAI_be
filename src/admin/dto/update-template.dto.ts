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

export class UpdateTemplateDto {
  @IsOptional()
  @IsEnum(EventTypes, {
    message: 'Invalid event type',
  })
  type: string;

  @IsOptional()
  @IsEnum(DiscountType, { message: 'Invalid discount type' })
  discountType: string;

  @IsOptional()
  @IsString()
  discountValue?: string;

  @IsOptional()
  contentCategories: any;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString({ each: true })
  keywords: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minTargetAge?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
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

  @IsOptional()
  businessIndustry?: any;

  @IsOptional()
  businessCategories?: string[];
}
