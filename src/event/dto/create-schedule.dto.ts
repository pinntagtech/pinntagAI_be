import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Schedule {
  date: Date;
  durations: Array<DurationDto>;
}

export class DurationDto {
//   @IsString()
//   @IsNotEmpty()
//   startTime: string;

//   @IsString()
//   @IsNotEmpty()
//   endTime: string;

  @IsNotEmpty()
  startHour: number;
  @IsNotEmpty()
  startMinute: number;
  @IsNotEmpty()
  endHour: number;
  @IsNotEmpty()
  endMinute: number;
}

export class DayScheduleDto {
  @IsBoolean()
  included: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DurationDto)
  durations: DurationDto[];
}

class ScheduleRequestData {
  date: String;
  durations: Array<DurationDto>;
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

export class CreateScheduleDto {
  @IsOptional()
  scheduleType: string; //fixed or recurring

  @IsOptional()
  @IsArray()
  fixedSchedule: Array<ScheduleRequestData> | Array<Schedule>;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecurringScheduleDataDto)
  recurringSchedule: RecurringScheduleDataDto;

  @IsOptional()
  date_range: boolean;

  @IsOptional()
  each_date: boolean; 
}
