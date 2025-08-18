import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';

export class FeatureLimitData {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  value: string; // examples: "unlimited", "enabled", "5"
}

export class CreateSubscriptionProductDto {
  @IsNotEmpty()
  @IsString()
  name: string; // e.g. "Pro", "Mobile", "Custom"

  @IsNotEmpty()
  @IsArray({ each: true })
  @Validate(FeatureLimitData, { each: true })
  features: FeatureLimitData[];

  @IsOptional()
  description?: string;

  @IsOptional()
  stripeProductId?: string;
}
