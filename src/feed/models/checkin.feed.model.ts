import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { Business } from 'src/business/model/business.model';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { BroadcastStatus } from 'src/enums/event.enums';
import { FeedVisibility } from 'src/feed/models/feed.model';
import { User } from 'src/user/models/user.model';

@Schema({ timestamps: true })
export class CheckInFeed extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  image: string;

  @Prop({ ref: 'User' })
  users: Array<mongoose.Types.ObjectId>;

  @Prop({ ref: Business.name })
  business: mongoose.Types.ObjectId;

  @Prop({ ref: User.name })
  creator: mongoose.Types.ObjectId;

  @Prop()
  isDeleted: boolean;

  @Prop({ enum: Object.values(FeedVisibility), default: FeedVisibility.PRIVATE })
  visibility: string;
}

export const CheckInFeedSchema = SchemaFactory.createForClass(CheckInFeed);