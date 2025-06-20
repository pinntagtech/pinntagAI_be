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
    EventTypes.OFFER,
    EventTypes.PRIVATE,
    EventTypes.FLASHDEAL,
  ])
  type: string;

  @IsNotEmpty()
  categories: any;

  @IsNotEmpty()
  @IsString()
  title: string;

  // @IsOptional()
  // keywords: Array<string>;

  @IsOptional()
  keywords: any;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  offset: string;
}
