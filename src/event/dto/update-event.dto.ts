import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EventTypes } from 'src/enums/event.enums';
import { Location } from '../../business-profile/models/types.model';
import { Schedule } from '../models/event.model';
import mongoose from 'mongoose';
class LocationRequestData {
  @IsString()
  location: string;
  @IsString()
  longitude;
}
class ScheduleRequestData {
  date: String;
  durations: Array<Duration>;
}
class RecurringSchedule {
  dayOfWeek: Array<string>;
  durations: Array<Duration>;
}

class Duration {
  startTime: Date;
  endTime: Date;
}
export class UpdateEventDto {
  // @IsOptional()
  // @IsString()
  // @IsIn([
  //   EventTypes.FORMAL,
  //   EventTypes.INFORMAL,
  //   EventTypes.OFFER,
  //   EventTypes.PRIVATE,
  // ])
  // type: string;

  @IsOptional()
  categories: Array<string> | Array<mongoose.Types.ObjectId>;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  keywords: Array<string>;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  scheduleType: string; //fixed or recurring

  @IsOptional()
  @IsArray()
  schedule: Array<ScheduleRequestData> | Array<Schedule>;

  @IsOptional()
  recurringSchedule: RecurringSchedule;

  @IsOptional()
  @IsArray()
  locations: Array<string> | Array<Location>;

  @IsOptional()
  @IsArray()
  ageGroupsAllowed: Array<string> | Array<mongoose.Types.ObjectId>;

  @IsOptional()
  @IsArray()
  targetGenders: Array<string>;

  @IsOptional()
  promotionCode: boolean | string;

  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsBoolean()
  isFree: boolean;

  @IsOptional()
  @IsString()
  participationCost: string;

  @IsOptional()
  @IsString()
  bookingUrl: string;

  @IsOptional()
  @IsBoolean()
  notifyFollowers: boolean;

  @IsOptional()
  RSVP: string;

  @IsOptional()
  @IsBoolean()
  termsApplied: boolean;

  @IsOptional()
  @IsString()
  termsAndConditions: string;

  @IsOptional()
  @IsString()
  uniqueCode: string;

  @IsOptional()
  @IsBoolean()
  specifyForEachDay: boolean;

  @IsOptional()
  @IsString()
  offset: string;

  @IsOptional()
  isFinalStep: boolean;
}
