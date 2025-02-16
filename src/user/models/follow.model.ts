import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from './user.model';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';

export type FollowDocument = Follow & mongoose.Document;
@Schema({ timestamps: true })
export class Follow {
  @Prop({ required: true, refPath: 'followerType' })
  follower: mongoose.Types.ObjectId;
  @Prop({ required: true, refPath: 'followingType' })
  following: mongoose.Types.ObjectId;
  @Prop({ required: true, enum: [User.name, BusinessProfile.name] })
  followerType: string;
  @Prop({ required: true, enum: [User.name, BusinessProfile.name] })
  followingType: string;
  @Prop({ default: false })
  isBlocked: boolean;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
