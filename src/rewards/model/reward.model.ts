import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ActivityType,
  RedemptionMode,
  RewardStatus,
  RewardType,
} from '../enums/rewards.enum';
import mongoose from 'mongoose';
import { Business } from 'src/business/model/business.model';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { Folder } from 'src/drive/models/folder.model';

export type RewardDocument = Reward & Document;

export class Schedule {
  startDate: Date;
  endDate: Date;
}
@Schema({ timestamps: true })
export class Reward {
  @Prop({
    enum: [
      RewardStatus.DRAFTED,
      RewardStatus.PUBLISHED,
      RewardStatus.CLOSED,
      RewardStatus.BLOCKED,
    ],
    default: RewardStatus.DRAFTED,
  })
  status: string;

  @Prop()
  title: string;

  @Prop({
    enum: Object.values(RewardType),
  })
  rewardType: string;

  @Prop({
    enum: Object.values(ActivityType),
  })
  activityType: string;
  @Prop()
  locations: Array<mongoose.Types.ObjectId>;

  @Prop()
  targetCount: number;
  @Prop()
  rewardSchedule: Schedule;

  @Prop({
    enum: Object.values(RedemptionMode),
  })
  redemptionMode: string;

  @Prop({ ref: Folder.name })
  drivePath: mongoose.Types.ObjectId;

  @Prop({ ref: File.name })
  QR_CODE: mongoose.Types.ObjectId;

  @Prop()
  rewardExpiration: number;

  @Prop({ ref: BusinessUser.name })
  user: mongoose.Types.ObjectId;

  @Prop({ ref: Business.name })
  businessProfile: mongoose.Types.ObjectId;

  @Prop({ default: false })
  termsApplied: boolean;

  @Prop()
  termsAndConditions: string;

  @Prop()
  description: string;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
