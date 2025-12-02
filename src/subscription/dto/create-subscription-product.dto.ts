import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { PricingModel } from '../models/subscription-product.model';

// export class FeatureLimitData {
//   @IsNotEmpty()
//   @IsString()
//   key: string;

//   @IsNotEmpty()
//   @IsString()
//   value: string; // examples: "unlimited", "enabled", "5"
// }

export class CreateSubscriptionProductDto {
  @IsNotEmpty()
  @IsString()
  name: string; // e.g. "Pro", "Mobile", "Custom"

  @IsNotEmpty()
  // @IsArray()
  // @Validate(FeatureLimitData, { each: true })
  features: Array<Object>; // Array of feature limits

  @IsOptional()
  description?: string;

  @IsOptional()
  stripeProductId?: string;

  @IsOptional()
  isRecommended?: boolean;

  @IsOptional()
  isFree: boolean;

  @IsOptional()
  minLocations?: number;

  @IsOptional()
  maxLocations?: number;

  @IsOptional()//flat, per_location
  pricingModel: string;
}
