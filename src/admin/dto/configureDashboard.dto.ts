import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import mongoose from 'mongoose';

export class ConfigureDashboardDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  offersIncluded: boolean;

  @IsOptional()
  @IsBoolean()
  eventsIncluded: boolean;

  @IsOptional()
  @IsBoolean()
  freeIncluded: boolean;

  @IsOptional()
  @IsArray()
  categories: Array<string | mongoose.Types.ObjectId>;

  @IsOptional()
  @IsArray()
  industries: Array<string | mongoose.Types.ObjectId>;

  @IsNotEmpty()
  @IsString()
  carouselType: string;

  @IsNotEmpty()
  @IsNumber()
  sortOrder: number;

  @IsNotEmpty()
  @IsString()
  cardType: string;
}
