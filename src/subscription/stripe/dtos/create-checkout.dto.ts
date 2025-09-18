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

  // @IsOptional()
  // @IsString()
  // promotionCode?: string; // Optional promotion code at checkout
}
