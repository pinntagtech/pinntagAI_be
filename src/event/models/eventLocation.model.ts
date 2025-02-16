import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

class LocationType {
  type: {
    type: string;
  };
  coordinates: Array<number>;
}

export type EventLocationDocument = EventLocation & Document;
@Schema({ timestamps: true })
export class EventLocation {
  @Prop({ required: true, ref: 'Event' })
  event: mongoose.Types.ObjectId;
  @Prop()
  location: LocationType;
  @Prop()
  businessLocationId: mongoose.Types.ObjectId;
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
