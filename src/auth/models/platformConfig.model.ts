import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type PlatformConfigDocument = PlatformConfig & mongoose.Document;

@Schema({ timestamps: true })
export class PlatformConfig {
  @Prop({ required: true, default: 0.5 })
  distanceWeightage: number;
  @Prop({ required: true, default: 0.5 })
  timeWeightage: number;
}

export const PlatformConfigSchema =
  SchemaFactory.createForClass(PlatformConfig);
