import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum FeatureLimitList {
  // AI_IMAGE = 'aiImage',
  // AI_TEXT = 'aiText',
  // DROP_PIN = 'dropPinn',
  // TEMPLATES = 'templates',
  // ANALYTICS = 'analytics',
  // REGIONS = 'regions',
  // ROLES = 'roles',
  // DEPARTMENT = 'departments',
  // STORAGE = 'storage',
  
  LOCATIONS = 'locations',
  CONTENT_SCHEDULING = 'contentScheduling',
  PUBLISHING_DROP_PIN = 'publishingDropPin',
  BOOKINGS = 'bookings',
  BROADCAST_FEED_POSTS = 'broadcastFeedPosts',
  BOOSTS_FEATURED = 'boostsFeatured',

}
// export const FeatureLimitLabels = {
//   LOCATIONS : 'locations',
//   CONTENT_SCHEDULING : 'Content Scheduling',
//   PUBLISHING_DROP_PIN : 'Publishing/Drop Pins',
//   BOOKINGS : 'Bookings',
//   BROADCAST_FEED_POSTS : 'Broadcasts/Feed posts',
//   BOOSTS_FEATURED : 'Access to Boosts/featured',
// }


@Schema({ timestamps: true })
export class FeatureLimit extends Document {
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'SubscriptionProduct',
    required: true,
  })
  product: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(FeatureLimitList) })
  key: string;

  @Prop({ required: true })
  value: string; // examples: "unlimited", "enabled", "5"

  @Prop()
  label: string;
}

export const FeatureLimitSchema = SchemaFactory.createForClass(FeatureLimit);
