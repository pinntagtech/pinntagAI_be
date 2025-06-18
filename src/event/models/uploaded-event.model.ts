import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { EventStatus, EventTypes } from 'src/enums/event.enums';
import { AgeGroup } from 'src/models/ageGroup.model';
import { Category } from 'src/models/contentCategory.model';
import { Image } from './image.model';
import { EventLocation } from './eventLocation.model';

export type UploadedEventDocument = UploadedEvent & Document;
@Schema({ timestamps: true })
export class UploadedEvent {
  @Prop({
    enum: [
      EventTypes.FORMAL,
      EventTypes.OFFER,
      EventTypes.PRIVATE,
    ],
  })
  type: string;
  @Prop({
    enum: [
      EventStatus.DRAFTED,
      EventStatus.PUBLISHED,
      EventStatus.CLOSED,
      EventStatus.BLOCKED,
    ],
    default: EventStatus.DRAFTED,
  })
  status: string;
  @Prop({ required: true, ref: Category.name })
  category: mongoose.Types.ObjectId;
  @Prop({ ref: Image.name })
  images: Array<mongoose.Types.ObjectId>;
  @Prop()
  title: string;
  @Prop()
  keywords: Array<string>;
  @Prop()
  description: string;
  @Prop()
  schedule: Array<Schedule>;
  @Prop({ ref: EventLocation.name })
  locations: Array<mongoose.Types.ObjectId>;
  @Prop({ ref: AgeGroup.name })
  ageGroupsAllowed: Array<mongoose.Types.ObjectId>;
  @Prop()
  targetGenders: Array<string>;
  @Prop()
  promotionCode: string;
  @Prop({ default: false })
  isFree: boolean;
  @Prop()
  participationCost: string;
  @Prop()
  bookingUrl: string;
  @Prop({ default: false })
  notifyFollowers: boolean;
  @Prop({ default: '' })
  RSVP: string;
  @Prop({ default: false })
  termsApplied: boolean;
  @Prop()
  termsAndConditions: string;
  @Prop()
  facebookPostId: string;
  @Prop({ default: false })
  specifyForEachDay: boolean;
  @Prop({ ref: 'User', default: [] })
  participants: Array<mongoose.Types.ObjectId>;
}

export class Schedule {
  date: Date;
  durations: Array<Duration>;
}

class Duration {
  startTime: Date;
  endTime: Date;
}

export const EventSchema = SchemaFactory.createForClass(UploadedEvent);
