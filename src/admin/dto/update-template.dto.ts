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
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minTargetAge?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxTargetAge?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetGenders: string[];

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsBoolean()
  isFree: boolean;

  @IsOptional()
  @IsString()
  participationCost?: string;

  @IsOptional()
  @IsBoolean()
  termsApplied: boolean;

  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @IsOptional()
  @IsMongoId()
  businessIndustry?: string | mongoose.Types.ObjectId;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  businessCategories?: string | mongoose.Types.ObjectId[];
}
