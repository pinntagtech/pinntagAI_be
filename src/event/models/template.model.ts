import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { Event, Schedule } from './event.model';
import { AgeGroup } from 'src/models/ageGroup.model';
import { Category } from 'src/models/contentCategory.model';

export type TemplateDocument = Template & mongoose.Document;

@Schema({ timestamps: true })
export class Template {
  @Prop({ enum: ['User', BusinessProfile.name] })
  creatorType: string;
  @Prop({ ref: 'User' })
  user: mongoose.Types.ObjectId;
  @Prop({ ref: BusinessProfile.name })
  businessProfile: mongoose.Types.ObjectId;
  @Prop({ ref: Event.name })
  event: mongoose.Types.ObjectId;
  @Prop({ ref: Category.name })
  category: mongoose.Types.ObjectId;
  @Prop()
  title: string;
  @Prop()
  keywords: Array<string>;
  @Prop()
  description: string;
  @Prop()
  schedule: Array<Schedule>;
  @Prop({ ref: AgeGroup.name })
  ageGroupsAllowed: Array<mongoose.Types.ObjectId>;
  @Prop()
  targetGenders: Array<string>;
  @Prop()
  promotionCode: string;
  @Prop()
  isFree: boolean;
  @Prop()
  participationCost: string;
  @Prop()
  bookingUrl: string;
  @Prop()
  notifyFollowers: boolean;
  @Prop({ default: '' })
  RSVP: string;
  @Prop()
  termsApplied: boolean;
  @Prop()
  termsAndConditions: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
