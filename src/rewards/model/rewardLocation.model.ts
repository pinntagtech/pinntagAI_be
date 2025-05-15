import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Outlet } from 'src/outlet/model/outlet.model';

class LocationType {
  type: {
    type: string;
  };
  coordinates: Array<number>;
}

export type RewardLocationDocument = RewardLocation & Document;
@Schema({ timestamps: true })
export class RewardLocation {
  @Prop({ required: true, ref: 'Event' })
  reward: mongoose.Types.ObjectId;
  @Prop()
  location: LocationType;
  @Prop({ref: Outlet.name})
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

export const RewardLocationSchema = SchemaFactory.createForClass(RewardLocation);
RewardLocationSchema.index({ location: '2dsphere' });
