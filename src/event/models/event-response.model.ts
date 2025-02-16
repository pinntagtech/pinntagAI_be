import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Event } from './event.model';
import mongoose from 'mongoose';
import { RSVPTypes } from 'src/enums/event.enums';

export type EventResponseDocument = EventResponse & Document;
@Schema({ timestamps: true })
export class EventResponse {
  @Prop({ required: true, ref: 'Event' })
  event: mongoose.Types.ObjectId;
  @Prop({ ref: 'User' })
  user: mongoose.Types.ObjectId;
  @Prop({ required: true, enum: Object.values(RSVPTypes) })
  response: string;
}

export const EventResponseSchema = SchemaFactory.createForClass(EventResponse);
