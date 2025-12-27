import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateFlashDealPaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  flashDealId: string;

  @IsString()
  @IsNotEmpty()
  businessId: string;

  // amount in smallest currency unit (e.g. cents/paise)
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string; // "usd", "gbp", "inr" etc

  @IsOptional()
  @IsString()
  consumerId?: string; // optional if you decode from JWT
}