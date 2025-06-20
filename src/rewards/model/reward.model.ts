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
import { Outlet } from 'src/outlet/model/outlet.model';
import { RewardLocation } from './rewardLocation.model';
import { File } from 'src/drive/models/file.model';

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
  @Prop({ref: RewardLocation.name})
  locations: Array<mongoose.Types.ObjectId>;

  @Prop()
  targetCount: number;
  
  @Prop()
  schedule: Schedule;

  @Prop({
    enum: Object.values(RedemptionMode),
  })
  redemptionMode: string;

  @Prop({ ref: Folder.name })
  drivePath: mongoose.Types.ObjectId;

  @Prop({ default: true })
  notifyFollowers: boolean;

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

  @Prop()
  activityQrCode: string;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

RewardSchema.index({ schedule: 1 });
RewardSchema.set('toObject', { virtuals: true }).set('toJSON', {
  virtuals: true,
});
RewardSchema.virtual('files', {
  ref: 'File', // the name of your File model
  localField: 'drivePath', // the field in Event
  foreignField: 'parentDirectory', // the field in File
  justOne: false,
});