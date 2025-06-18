import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Business } from 'src/business/model/business.model';
import { Outlet } from 'src/outlet/model/outlet.model';

class LocationType {
  type: {
    type: string;
  };
  coordinates: Array<number>;
}

export type EventLocationDocument = EventLocation & Document;
@Schema({ timestamps: true })
export class EventLocation {
  @Prop({ default: false })
  isFromCrawler: boolean;
  @Prop({ required: true, ref: 'Event' })
  event: mongoose.Types.ObjectId;
  @Prop()
  location: LocationType;
  @Prop({ ref: Outlet.name })
  businessLocationId: mongoose.Types.ObjectId;
  @Prop({ ref: Business.name })
  businessProfile: mongoose.Types.ObjectId;
  @Prop()
  accuracy: number;
  @Prop()
  address1: string;
  @Prop()
  address2: string;
  @Prop()
  city: string;
  @Prop()
  state: string;
  @Prop()
  zip: string;
  @Prop()
  website: string;
  @Prop()
  email: string;
  @Prop()
  phone: string;
}

export const EventLocationSchema = SchemaFactory.createForClass(EventLocation);
EventLocationSchema.index({ location: '2dsphere' });
