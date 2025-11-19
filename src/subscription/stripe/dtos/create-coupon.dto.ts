import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string; // Unique code for the coupon

  @IsNotEmpty()
  type: 'percent' | 'flat'; // Type of discount

  @IsOptional()
  percentOff: number; // Percentage discount (e.g., 20 for 20% off)

  @IsOptional()
  amountOff: number;

  @IsNotEmpty()
  @IsString()
  duration: 'once' | 'repeating' | 'forever'; // Duration type

  @IsOptional()
  durationInMonths?: number; // Required if duration is 'repeating'

  @IsOptional()
  maxRedemptions?: number; // Optional maximum number of redemptions

  @IsOptional()
  redeemBy?: Date; // Optional expiration date for the coupon
}
