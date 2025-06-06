import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class CreateIndustryDto {
  @IsString()
  title: string;
  @IsString()
  lightIcon: string;
  @IsString()
  darkIcon: string;
  @IsString()
  activeColor: string;
}

export class UpdateIndustryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  title?: string;

  @IsOptional()
  @IsString()
  lightIcon: string;

  @IsOptional()
  @IsString()
  darkIcon: string;

  @IsOptional()
  @IsString()
  activeColor: string;
}
