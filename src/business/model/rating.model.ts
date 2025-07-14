import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class Rating {
  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  businessId: mongoose.Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ default: '' })
  comment: string;
}

export type RatingDocument = Rating & Document;
export const RatingSchema = SchemaFactory.createForClass(Rating);
