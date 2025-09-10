import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBroadcastDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  // @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  // @IsArray()
  @IsNotEmpty()
  @IsString()
  users: string;

  @IsOptional()
  schedule: string;

  @IsOptional()
  isScheduled: string;
}
