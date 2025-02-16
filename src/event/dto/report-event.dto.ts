import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';
import { ReportTypes } from 'src/enums/event.enums';

export class ReportEventDto {
  @IsNotEmpty()
  @IsString()
  event: string | mongoose.Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsIn([ReportTypes.VALIDITY, ReportTypes.INAPPROPRIATE, ReportTypes.OTHER])
  type: string;

  @IsOptional()
  @IsString()
  description: string;
}
