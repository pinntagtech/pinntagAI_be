import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Reward } from './reward.model';
import { ClaimStatus } from '../enums/rewards.enum';
import { User } from 'src/user/models/user.model';
import { Business } from 'src/business/model/business.model';

export type UserRewardDocument = UserReward & Document;

@Schema({ timestamps: true })
export class UserReward {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Reward.name, required: true })
  rewardId: mongoose.Types.ObjectId;

  @Prop({ref: Business.name})
  businessProfile: mongoose.Types.ObjectId;

  @Prop({ 
    enum: Object.values(ClaimStatus),
    default: ClaimStatus.ACTIVE 
  })
  claimStatus: string;

  @Prop({ type: Date, default: () => new Date() })
  claimedAt: Date;

//   @Prop({ type: Date })
//   redeemedAt?: Date;

 @Prop()
  target: number;

  @Prop({ type: Number, default: 0 })
  progress?: number;
}

export const UserRewardSchema = SchemaFactory.createForClass(UserReward);
