import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum RewardVisitStatus {
  CONFIRMED = 'CONFIRMED',
  MARKED_WRONG = 'MARKED_WRONG',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

@Schema({ timestamps: true })
export class RewardVisit extends Document {

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  })
  business: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true })
  locationId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward', // adjust ref name if your collection differs
    required: true,
  })
  reward: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'CheckIn' })
  checkInId?: mongoose.Types.ObjectId; // optional but recommended

  @Prop({
    type: String,
    enum: Object.values(RewardVisitStatus),
    default: RewardVisitStatus.CONFIRMED,
  })
  status: RewardVisitStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' })
  markedWrongBy?: mongoose.Types.ObjectId; // staffId, if applicable

  @Prop()
  markedWrongReason?: string; // optional short text

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SupportCase' })
  supportCaseId?: mongoose.Types.ObjectId;
}

export const RewardVisitSchema = SchemaFactory.createForClass(RewardVisit);

// Helpful indexes
RewardVisitSchema.index({ userId: 1, rewardProgramId: 1, status: 1 });
RewardVisitSchema.index({ businessId: 1, locationId: 1, status: 1 });
// RewardVisitSchema.index({ rewardProgramId: 1, createdAt: -1 });
