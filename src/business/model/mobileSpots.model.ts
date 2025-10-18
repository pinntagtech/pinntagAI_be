import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { EventSchedule } from 'src/event/models/event-schedule.model';
import { Outlet } from 'src/outlet/model/outlet.model';

class LocationType {
  type: {
    type: string;
  };
  coordinates: Array<number>;
}

@Schema({ timestamps: true })
export class MobileSpots extends Document{
  @Prop()
  spotId: string;

  @Prop()
  name: string;

  @Prop({ ref: 'Business' })
  business: mongoose.Types.ObjectId; // Dropdown reference to Business entity

  @Prop({ ref: 'Outlet' })
  outlet: mongoose.Types.ObjectId;

  @Prop()
  creator: mongoose.Types.ObjectId;

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
  country: string;

  @Prop()
  postalCode: string;

  @Prop()
  latitude: number;
  @Prop()
  longitude: number;

  @Prop()
  location: LocationType;

  @Prop({ ref: EventSchedule.name })
  schedule: mongoose.Types.ObjectId;
}


export const MobileSpotsSchema = SchemaFactory.createForClass(MobileSpots);