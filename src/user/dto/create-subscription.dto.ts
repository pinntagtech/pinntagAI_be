import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsOptional()
  product: string; 
  
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;

  @IsNotEmpty()
  @IsString()
  priceId: string;

  @IsOptional()
  @IsBoolean()
  saveCard: boolean;

  @IsOptional()
  @IsString()
  businessProfileId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  prorationDate: number;
}
