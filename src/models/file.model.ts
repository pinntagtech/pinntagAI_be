import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';


export type fileDocument = File & Document;
@Schema({ timestamps: true })
export class File {
  @Prop()
  gallery: mongoose.Types.ObjectId;
  @Prop()
  type:;
  @Prop({ required: true })
  url: string;
  @Prop()
  isCoverImage: boolean;
}

export const FileSchema = SchemaFactory.createForClass(File);
