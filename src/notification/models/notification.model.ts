import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Business } from 'src/business/model/business.model';
// import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { NotificationTypes } from 'src/enums/event.enums';
import { Reward } from 'src/rewards/model/reward.model';
import { User } from 'src/user/models/user.model';

export type NotificationDocument = Notification & Document;
@Schema({ timestamps: true })
export class Notification {
  @Prop({ ref: 'User' })
  user: mongoose.Types.ObjectId;
  @Prop({
    enum: [
      NotificationTypes.FOLLOW,
      NotificationTypes.EVENT,
      NotificationTypes.OFFER,
      NotificationTypes.COMMENT,
      NotificationTypes.LIKE,
      NotificationTypes.SHARE,
      NotificationTypes.MENTION,
      NotificationTypes.REVIEW,
      NotificationTypes.REPORT,
      NotificationTypes.REWARD,
    ],
  })
  type: string;
  @Prop()
  message: string;
  @Prop({ enum: [User.name, Business.name] })
  targetType: string;
  @Prop({ refPath: 'targetType' })
  targetUser: mongoose.Types.ObjectId;
  @Prop({ default: false })
  isRead: boolean;
  @Prop({ ref: 'Event' })
  event: mongoose.Types.ObjectId;
  @Prop({ref: Reward.name})
  reward: mongoose.Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
