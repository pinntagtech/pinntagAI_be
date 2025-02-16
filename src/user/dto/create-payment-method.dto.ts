import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsNotEmpty()
  @IsString()
  number: string;
  @IsNotEmpty()
  @IsNumber()
  exp_month: number;
  @IsNotEmpty()
  @IsNumber()
  exp_year: number;
  @IsNotEmpty()
  @IsString()
  cvc: string;
}
