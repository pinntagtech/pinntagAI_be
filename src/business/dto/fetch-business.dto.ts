import { IsOptional, IsString } from 'class-validator';

export class FetchBusinessDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  businessCategory?: string;

  @IsOptional()
  @IsString()
  businessIndustry?: string;
}
