import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { Business } from 'src/business/model/business.model';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { User } from 'src/user/models/user.model';

@Schema({ timestamps: true })
export class Broadcast extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  image: string;

  @Prop({ ref: User.name })
  users: Array<mongoose.Types.ObjectId>;

  @Prop({ ref: Business.name })
  business: mongoose.Types.ObjectId;

  @Prop({ ref: BusinessUser.name })
  creator: mongoose.Types.ObjectId;

  @Prop()
  schedule: Date;

  @Prop()
  isDeleted: boolean;

}

export const BroadcastSchema = SchemaFactory.createForClass(Broadcast);
