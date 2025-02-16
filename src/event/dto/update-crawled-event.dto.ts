import { IsArray, IsOptional, IsString } from 'class-validator';
import { Schedule } from '../models/event.model';

export class UpdateCrawledEventDto {
  @IsOptional()
  @IsString()
  type: string;
  
  @IsOptional()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  dates: string;

  @IsOptional()
  @IsArray()
  schedule: Array<Schedule>;

  @IsOptional()
  @IsString()
  image: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  participationCost: string;

  @IsOptional()
  @IsString()
  phone: string;
  
  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  website: string;

  @IsOptional()
  coordinates: Object;
}
