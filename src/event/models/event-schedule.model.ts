import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Event } from './event.model';
import mongoose from 'mongoose';
import { WeekDays } from 'src/enums/event.enums';
import { Business } from 'src/business/model/business.model';

const sampleData = {
  startDate: new Date(),
  endDate: new Date('2025-05-31'),
  data: {
    sunday: {
      included: true,
      durations: [
        {
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          startTime: '12:00',
          endTime: '13:00',
        },
      ],
    },
    monday: {
      included: true,
      durations: [
        {
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          startTime: '12:00',
          endTime: '13:00',
        },
      ],
    },
    tuesday: {
      included: true,
      durations: [
        {
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          startTime: '12:00',
          endTime: '13:00',
        },
      ],
    },
    wednesday: {
      included: true,
      durations: [
        {
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          startTime: '12:00',
          endTime: '13:00',
        },
      ],
    },
    thursday: {
      included: true,
      durations: [
        {
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          startTime: '12:00',
          endTime: '13:00',
        },
      ],
    },
    friday: {
      included: true,
      durations: [
        {
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          startTime: '12:00',
          endTime: '13:00',
        },
      ],
    },
    saturday: {
      included: false,
      durations: [],
    },
  },
};

export const ScheduleTypes = {
  FIXED: 'fixed',
  RECURRING: 'recurring',
};

export class FixedSchedule {
  date: Date;
  durations: Array<fixedDuration>;
}
class fixedDuration {
  startTime: Date;
  endTime: Date;
}
class Duration {
  // startTime: String;
  // endTime: String;

  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export class DaySchedule {
  @Prop()
  included: boolean;

  @Prop()
  durations: Array<Duration>;
}
const weekDaysType = {
  sunday: { type: DaySchedule },
  monday: { type: DaySchedule },
  tuesday: { type: DaySchedule },
  wednesday: { type: DaySchedule },
  thursday: { type: DaySchedule },
  friday: { type: DaySchedule },
  saturday: { type: DaySchedule },
};
export class RecurringSchedule {
  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({
    type: weekDaysType,
  })
  weekDays: {
    sunday: DaySchedule;
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
  };
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

  @Prop({ ref: Business.name })
  businessId: mongoose.Types.ObjectId;
  @Prop({ default: false })
  isFromCrawler: boolean;
}

export const EventScheduleSchema = SchemaFactory.createForClass(EventSchedule);
