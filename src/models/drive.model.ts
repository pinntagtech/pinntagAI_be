import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { Event } from 'src/event/models/event.model';
import { Image } from 'src/event/models/image.model';
import { User } from 'src/user/models/user.model';

export type DriveDocument = Drive & mongoose.Document;
@Schema({ timestamps: true })
export class Drive {
  @Prop({ required: true, refPath: 'ownerType' })
  owner: mongoose.Types.ObjectId;
  @Prop({required:true,enum:[User.name,BusinessProfile.name,Event.name,A]})
  ownerType:string;
  @Prop()
  images:Array<mongoose.Types.ObjectId>;
  @Prop()
  videos:Array<mongoose.Types.ObjectId>;
  @Prop()
  documents:Array<mongoose.Types.ObjectId>;
}   

export const DriveSchema = SchemaFactory.createForClass(Drive);
