import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
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
  roles: any;
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  name?: string;
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description?: string;

  @IsOptional()
  roles?: string[];
}
