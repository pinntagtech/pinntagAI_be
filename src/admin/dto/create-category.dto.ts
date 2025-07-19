import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  title: string;
  @IsOptional()
  @IsString()
  description: string;
  @IsString()
  lightIcon: string;
  @IsString()
  darkIcon: string;

  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase() : value)
  @IsString()
  activeColor: string;
}
