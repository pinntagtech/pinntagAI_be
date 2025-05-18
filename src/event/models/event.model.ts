import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { DiscountType, EventStatus, EventTypes } from 'src/enums/event.enums';
import { AgeGroup } from 'src/models/ageGroup.model';
import { Category } from 'src/models/contentCategory.model';
import { Image } from './image.model';
import { EventLocation } from './eventLocation.model';
import { EventResponse } from './event-response.model';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { Outlet } from 'src/outlet/model/outlet.model';
import { Business } from 'src/business/model/business.model';
import { EventSchedule } from './event-schedule.model';
import { IsEnum } from 'class-validator';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ default: false })
  isFromCrawler: boolean;
  @Prop({
    required: true,
    enum: [
      EventTypes.FORMAL,
      EventTypes.INFORMAL,
      EventTypes.OFFER,
      EventTypes.PRIVATE,
      EventTypes.LISTING,
    ],
  })
  type: string;

  @IsEnum(DiscountType, { message: 'Invalid discount type' })
  discountType: string;

  @Prop()
  discountValue: string;

  @Prop({ required: true, enum: ['User', BusinessUser.name] })
  creatorType: string;

  @Prop({ refPath: 'creatorType' })
  user: mongoose.Types.ObjectId;

  @Prop({ ref: Business.name })
  businessProfile: mongoose.Types.ObjectId;

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
  categories: Array<mongoose.Types.ObjectId>;

  @Prop({ ref: 'Folder' })
  drivePath: mongoose.Types.ObjectId;

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

  @Prop({ ref: EventSchedule.name })
  eventSchedule: Array<mongoose.Types.ObjectId>;

  @Prop({ ref: EventLocation.name })
  locations: Array<mongoose.Types.ObjectId>; //Event Locations Ids

  // @Prop({ ref: AgeGroup.name })
  // ageGroupsAllowed: Array<mongoose.Types.ObjectId>;

  @Prop()
  minTargetAge: number;

  @Prop()
  maxTargetAge: number;

  @Prop()
  targetGenders: Array<string>;
  @Prop()
  promotionCode: string;
  @Prop({ default: false })
  isFree: boolean;
  @Prop()
  participationCost: string;
  @Prop()
  bookingUrl: string[];

  @Prop({ default: false })
  notifyFollowers: boolean;

  @Prop({ default: '' })
  RSVP: string;

  @Prop({ default: false })
  termsApplied: boolean;

  @Prop()
  termsAndConditions: string;

  @Prop()
  isPostedOnFacebook: boolean;
  @Prop()
  facebookPostId: string;
  @Prop({ default: false })
  specifyForEachDay: boolean;
  @Prop({ ref: 'User', default: [] })
  participants: Array<mongoose.Types.ObjectId>;
  @Prop()
  offset: string;
  @Prop({ required: false })
  eventUrl?: string;
  @Prop({ default: [], ref: EventResponse.name })
  responses: Array<mongoose.Types.ObjectId>;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ default: 0 })
  engagementCount: number;

  @Prop({ default: null })
  quantityLimit: number;

  // @Prop({ ref: Business.name })
  // business: mongoose.Types.ObjectId;
}

export class Schedule {
  date: Date;
  durations: Array<Duration>;
}
class Duration {
  startTime: Date;
  endTime: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.index({ schedule: 1 });
EventSchema.set('toObject', { virtuals: true }).set('toJSON', {
  virtuals: true,
});
EventSchema.virtual('files', {
  ref: 'File', // the name of your File model
  localField: 'drivePath', // the field in Event
  foreignField: 'parentDirectory', // the field in File
  justOne: false,
});
