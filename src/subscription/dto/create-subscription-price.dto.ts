import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { BillingInterval } from '../models/subscription-price.model';

export class CreateSubscriptionPriceDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(BillingInterval))
  billingInterval: BillingInterval; // e.g. "month" or "year"

  @IsNotEmpty()
  @IsString()
  currency: string; // e.g. "USD"

  @IsNotEmpty()
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

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean; // Indicates if this is a custom price
}
