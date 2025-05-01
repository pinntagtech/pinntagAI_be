import { IsArray, IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class UpdateOfferDto {
  @IsOptional()
  categories: Array<string> | Array<mongoose.Types.ObjectId>;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  locations: Array<string> | Array<Location>;
}
