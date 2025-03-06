import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { Image } from 'src/event/models/image.model';

export type GalleryDocument = Gallery & mongoose.Document;
@Schema({ timestamps: true })
export class Gallery {
  @Prop({ required: true, ref: BusinessProfile.name })
  businessProfile: mongoose.Types.ObjectId;
}   

export const GallerySchema = SchemaFactory.createForClass(Gallery);
