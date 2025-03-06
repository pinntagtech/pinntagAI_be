import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import mongoose from 'mongoose';
import { EventTypes } from 'src/enums/event.enums';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  @IsIn([
    EventTypes.FORMAL,
    EventTypes.INFORMAL,
    EventTypes.OFFER,
    EventTypes.PRIVATE,
    EventTypes.LISTING,
  ])
  type: string;

  @IsNotEmpty()
  @IsString()
  category: string | mongoose.Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  title: string;

  // @IsOptional()
  // keywords: Array<string>;

  @IsOptional()
  keywords: any;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  offset: string;
}
