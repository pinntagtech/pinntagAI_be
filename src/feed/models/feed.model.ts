import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { Admin } from 'src/admin/models/admin.model';
import { Business } from 'src/business/model/business.model';
import { FeedTypes } from 'src/enums/auth.enums';
import { Broadcast } from 'src/notification/models/broadcast.model';
import { Follow } from 'src/user/models/follow.model';

export const FeedVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  FOLLOWERS: 'followers',
};

@Schema({ timestamps: true })
export class Feed extends Document {
  @Prop({
    enum: [
      FeedTypes.AGENDA,
      FeedTypes.BROADCAST,
      FeedTypes.MEDIA,
      FeedTypes.NEWS,
    ],
  })
  feedType: string;

  @Prop({ enum: [Business.name, Admin.name] })
  creatorType: string;

  @Prop({ refPath: 'creatorType' })
  creator: mongoose.Types.ObjectId;

  @Prop({ refPath: 'feedType' })
  content: mongoose.Types.ObjectId;

  @Prop({ enum: Object.values(FeedVisibility), default: FeedVisibility.PUBLIC })
  visibility: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  likes: mongoose.Types.ObjectId[];
  @Prop({ default: 0 })
  totalLikes: number;

  @Prop()
  shareableLink: string;
}

export const FeedSchema = SchemaFactory.createForClass(Feed);
