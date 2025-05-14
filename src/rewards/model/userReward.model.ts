import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type UserRewardDocument = UserReward & Document;

@Schema({ timestamps: true })
export class UserReward {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUser', required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true })
  rewardId: mongoose.Types.ObjectId;

  @Prop({ 
    enum: ['claimed', 'redeemed', 'expired'], 
    default: 'claimed' 
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

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata?: any;
}

export const UserRewardSchema = SchemaFactory.createForClass(UserReward);
