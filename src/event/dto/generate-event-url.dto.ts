import { IsString } from 'class-validator';
import mongoose from 'mongoose';

export class GenerateEventUrlDto {
  @IsString()
  eventId: string | mongoose.Types.ObjectId;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  imageUrl: string;
}
