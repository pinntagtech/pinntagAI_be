import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Event } from './event.model';
import mongoose from 'mongoose';
import { User } from 'src/user/models/user.model';

export type SavedEventDocument = SavedEvent & Document;
@Schema({ timestamps: true })
export class SavedEvent {
  @Prop({ required: true, ref: Event.name })
  event: mongoose.Types.ObjectId;
  @Prop({ required: true, ref: User.name })
  user: mongoose.Types.ObjectId;
}

export const SavedEventSchema = SchemaFactory.createForClass(SavedEvent);