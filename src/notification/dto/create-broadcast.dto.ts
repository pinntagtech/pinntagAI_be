import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBroadcastDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  // @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  // @IsArray()
  @IsString()
  users: string;

  @IsNotEmpty()
  @IsString()
  visibility: string;

  @IsOptional()
  schedule: string;

  @IsOptional()
  isScheduled: string;
}
