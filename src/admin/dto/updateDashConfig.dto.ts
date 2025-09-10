import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import mongoose from 'mongoose';

export class UpdateConfigureDashboardDto {
  @IsOptional()
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
  categories: Array<string> | Array<mongoose.Types.ObjectId>;

  @IsOptional()
  @IsNumber()
  sortOrder: number;

  @IsOptional()
  @IsArray()
  industries: Array<string> | Array<mongoose.Types.ObjectId>;

  @IsOptional()
  @IsString()
  cardType: string;

  @IsOptional()
  @IsString()
  carouselType: string;
}
