import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Business } from 'src/business/model/business.model';
import { BusinessUser } from 'src/business/model/businessUser.model';
// import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { NotificationTypes } from 'src/enums/event.enums';
import { Reward } from 'src/rewards/model/reward.model';
import { User } from 'src/user/models/user.model';

export type NotificationDocument = Notification & Document;
@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, refPath: 'userType' })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: [User.name, BusinessUser.name] })
  userType: string;

  @Prop({
    enum: [
      NotificationTypes.FOLLOW,
      NotificationTypes.EVENT,
      NotificationTypes.REPORT,
      NotificationTypes.REWARD,

      NotificationTypes.OFFER,
      NotificationTypes.COMMENT,
      NotificationTypes.LIKE,
      NotificationTypes.SHARE,
      NotificationTypes.MENTION,
      NotificationTypes.REVIEW,
      NotificationTypes.BROADCAST,
    ],
  })
  type: string;
  @Prop()
  title: string;
  @Prop()
  message: string;

  @Prop()
  image: string;

  @Prop({ enum: [User.name, Business.name] })
  targetType: string;
  @Prop({ refPath: 'targetType' })
  targetUser: mongoose.Types.ObjectId;
  @Prop({ default: false })
  isRead: boolean;
  @Prop({ ref: 'Event' })
  event: mongoose.Types.ObjectId;
  @Prop({ ref: Reward.name })
  reward: mongoose.Types.ObjectId;
  @Prop({ ref: Business.name })
  business: mongoose.Types.ObjectId;

  @Prop()
  broadcast: mongoose.Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
