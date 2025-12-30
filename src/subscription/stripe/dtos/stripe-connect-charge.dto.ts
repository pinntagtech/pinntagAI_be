import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFlashDealPaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  flashDealId: string;

  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  consumerId?: string; // optional if you decode from JWT
}