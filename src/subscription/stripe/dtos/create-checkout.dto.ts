import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateCheckoutDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string; // Which subscription product

  @IsMongoId()
  @IsNotEmpty()
  priceId: string; // The price (monthly/yearly)

  // @IsMongoId()
  // @IsNotEmpty()
  // businessId: string; // Business profile that’s subscribing

  @IsOptional()
  @IsString()
  couponCode?: string; // Optional coupon/referral at checkout

  @IsOptional()
  quantity?: number; // Quantity of the subscription

  // @IsOptional()
  // @IsString()
  // promotionCode?: string; // Optional promotion code at checkout
}