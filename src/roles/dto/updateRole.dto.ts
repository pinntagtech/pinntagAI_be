import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsNotEmpty()
  @IsString()
  roleId: string;
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;
  @IsOptional()
  @IsString()
  description: string;
}
