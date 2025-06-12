import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EventTypes } from 'src/enums/event.enums';
import { Schedule } from '../models/event.model';
import mongoose from 'mongoose';
import { Type } from 'class-transformer';
class ScheduleRequestData {
  date: String;
  durations: Array<DurationDto>;
}

export class DurationDto {
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;
}

export class DayScheduleDto {
  @IsBoolean()
  included: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DurationDto)
  durations: DurationDto[];
}

export class WeekDaysDto {
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday: DayScheduleDto;
}

export class RecurringScheduleDataDto {
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsObject()
  @ValidateNested()
  @Type(() => WeekDaysDto)
  weekDays: WeekDaysDto;
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
  @ValidateNested()
  @Type(() => RecurringScheduleDataDto)
  recurringSchedule: RecurringScheduleDataDto;

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
