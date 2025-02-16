import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import mongoose from 'mongoose';

export class ConfigureDashboardDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsBoolean()
  offersIncluded: boolean;

  @IsNotEmpty()
  @IsBoolean()
  eventsIncluded: boolean;

  @IsNotEmpty()
  @IsBoolean()
  freeIncluded: boolean;

  @IsNotEmpty()
  @IsArray()
  categories: Array<string | mongoose.Types.ObjectId>;

  @IsNotEmpty()
  @IsNumber()
  sortOrder: number;
}
