import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User } from './user.model';
import { Business } from 'src/business/model/business.model';

export type FollowDocument = Follow & mongoose.Document;
@Schema({ timestamps: true })
export class Follow {
  @Prop({ required: true, refPath: 'followerType' })
  follower: mongoose.Types.ObjectId;
  @Prop({ required: true, refPath: 'followingType' })
  following: mongoose.Types.ObjectId;
  @Prop({ required: true, enum: [User.name, Business.name] })
  followerType: string;
  @Prop({ required: true, enum: [User.name, Business.name] })
  followingType: string;
  @Prop({ default: false })
  isBlocked: boolean;
  @Prop({default:false})
  muted:boolean;
  @Prop()
  mutedUntil: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
