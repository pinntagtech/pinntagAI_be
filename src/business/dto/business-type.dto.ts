import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class TypeDataDto {
  @IsOptional()
  @IsString()
  businessIndustry: string;
  
  @IsOptional()
  @IsArray()
  businessCategories: Array<string | mongoose.Types.ObjectId>;

}
