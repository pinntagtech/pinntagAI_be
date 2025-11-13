import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { File } from 'src/drive/models/file.model';

@Schema({ timestamps: true })
export class FeaturedAsset extends Document {
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ ref: File.name })
  file: mongoose.Types.ObjectId;
}

export const FeaturedAssetSchema = SchemaFactory.createForClass(FeaturedAsset);
