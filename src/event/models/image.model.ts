import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type ImageDocument = Image & Document;
@Schema({ timestamps: true })
export class Image {
  @Prop()
  gallery: mongoose.Types.ObjectId;
  @Prop()
  event: mongoose.Types.ObjectId;
  @Prop({ required: true })
  url: string;
  @Prop()
  isCoverImage: boolean;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
