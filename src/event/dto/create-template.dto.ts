import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTemplateDto {
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  discountType: string;

  @IsNotEmpty()
  categories: string;

  @IsNotEmpty()
  title: string;

  @IsOptional()
  keywords: string;

  @IsNotEmpty()
  description: string;

  @IsOptional()
  termsAndConditions: string;
}

