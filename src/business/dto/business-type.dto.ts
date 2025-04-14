import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class TypeDataDto {
  @IsNotEmpty()
  @IsArray()
  businessCategories: Array<string | mongoose.Types.ObjectId>;

  @IsString()
  businessIndustry: string;
}
