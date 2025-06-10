import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';
import { ReportTypes } from 'src/enums/event.enums';

export class ReportEventDto {
  @IsNotEmpty()
  @IsString()
  event: string | mongoose.Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(ReportTypes))
  type: string;

  @IsOptional()
  @IsString()
  description: string;
}
