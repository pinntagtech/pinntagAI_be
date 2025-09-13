import { IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { BillingInterval } from '../models/subscription-price.model';

export class UpdateSubscriptionPriceDto {
  @IsOptional()
  @IsString()
  currency: string; // e.g. "USD"

  @IsOptional()
  price: number; // Price in smallest currency unit, e.g. cents for USD

  @IsOptional()
  @IsString()
  stripePriceId?: string; // Stripe Price ID, if already created in Stripe

  @IsOptional()
  @IsString()
  appleProductId?: string; // Apple App Store product identifier (SKU)

  @IsOptional()
  @IsString()
  googleProductId?: string; // Google Play subscription product ID (SKU)
}
