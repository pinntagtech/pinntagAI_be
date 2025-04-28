import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  title: string;
  @IsOptional()
  @IsString()
  description: string;
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
