import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Event } from './event.model';
import mongoose from 'mongoose';
import { WeekDays } from 'src/enums/event.enums';

export const ScheduleTypes = {
  FIXED: 'fixed',
  RECURRING: 'recurring',
};

export class FixedSchedule {
  date: Date;
  durations: Array<Duration>;
}
class Duration {
  startTime: Date;
  endTime: Date;
}


export class RecurringSchedule {
  dayOfWeek: Array<WeekDays>;
  durations: Array<Duration>;
}

export type EventScheduleDocument = EventSchedule & mongoose.Document;

@Schema({ timestamps: true })
export class EventSchedule {
  @Prop({ required: true, enum: Object.values(ScheduleTypes) })
  type: string;

  @Prop()
  event: mongoose.Types.ObjectId;

  @Prop()
  fixedSchedule: FixedSchedule;

  @Prop()
  recurringSchedule: RecurringSchedule;
}


export const ScheduleSchema = SchemaFactory.createForClass(EventSchedule);