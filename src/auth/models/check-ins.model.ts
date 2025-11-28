import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

class LocationType {
  type: {
    type: string;
  };
  coordinates: Array<number>;
}

@Schema({ timestamps: true })
export class CheckIn extends Document{
  @Prop()
  user: mongoose.Types.ObjectId;

  @Prop()
  business: mongoose.Types.ObjectId;

  @Prop()
  locationId:mongoose.Types.ObjectId;

  @Prop()
  expiry: Date;

  @Prop()
  latitude: number;
  @Prop()
  longitude: number;
  @Prop()
  location: LocationType;
  @Prop({ type: String, enum: ['geo', 'qr', 'beacon', 'manual'], default: 'geo' })
  source: 'geo' | 'qr' | 'beacon' | 'manual';
}

export const CheckInSchema = SchemaFactory.createForClass(CheckIn);