import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateRegionDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;

  @IsOptional()
  @IsArray()
  users: string[];
}

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  name?: string;
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;

  @IsOptional()
  users?: string[];
}
