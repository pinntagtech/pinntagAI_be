import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BusinessCategoryDto {
  @IsNotEmpty()
  @IsString()
  industry: any;
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  title: string;
  @IsString()
  lightIcon: string;
  @IsString()
  darkIcon: string;
  @IsString()
  activeColor: string;
}

export class UpdateBusinessCategoryDto {
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
