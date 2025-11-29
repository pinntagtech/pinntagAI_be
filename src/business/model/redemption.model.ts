import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum ScratchStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  DISPUTED = 'DISPUTED',
}

export enum ConsumerVoteStatus {
  NONE = 'NONE',
  CONFIRMED = 'CONFIRMED',
  DISPUTED = 'DISPUTED',
}

export enum BusinessVoteStatus {
  NONE = 'NONE',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class Scratch extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true })
  businessId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true })
  locationId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'CheckIn', required: true })
  checkInId: mongoose.Types.ObjectId;

  // One of these should be set:
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Deal' })
  dealId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Reward' })
  rewardId?: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ScratchStatus),
    default: ScratchStatus.PENDING,
  })
  status: ScratchStatus;

  @Prop({ type: Date, required: true })
  validUntil: Date; // e.g. now + 10 minutes (configurable per deal type)

  @Prop({
    type: String,
    enum: Object.values(ConsumerVoteStatus),
    default: ConsumerVoteStatus.NONE,
  })
  consumerVoteStatus: ConsumerVoteStatus;

  @Prop({
    type: String,
    enum: Object.values(BusinessVoteStatus),
    default: BusinessVoteStatus.NONE,
  })
  businessVoteStatus: BusinessVoteStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' })
  businessVoteBy?: mongoose.Types.ObjectId; // staffId

  @Prop({ type: Date })
  businessVoteAt?: Date;

  @Prop()
  consumerFeedbackMessage?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'SupportCase' })
  supportCaseId?: mongoose.Types.ObjectId;

  // createdAt / updatedAt will be auto-added by { timestamps: true }
  createdAt: Date;
  updatedAt: Date;
}

export const ScratchSchema = SchemaFactory.createForClass(Scratch);

// Helpful indexes
ScratchSchema.index({ userId: 1, status: 1 });
ScratchSchema.index({ businessId: 1, locationId: 1, status: 1 });
ScratchSchema.index({ validUntil: 1 });
