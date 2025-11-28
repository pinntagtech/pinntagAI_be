import { Prop, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';

class LocationType {
  type: {
    type: string;
  };
  coordinates: Array<number>;
}

@Schema({ timestamps: true })
export class CheckIn {
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
}
