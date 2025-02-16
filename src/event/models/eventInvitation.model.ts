import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Event } from './event.model';
import mongoose from 'mongoose';

export type EventInvitationDocument = EventInvitation & Document;
@Schema({ timestamps: true })
export class EventInvitation {
  @Prop({ required: true, ref: Event.name })
  event: mongoose.Types.ObjectId;
  @Prop({ default: [], ref: 'User' })
  usersAdded: Array<mongoose.Types.ObjectId>;
}

export const EventInvitationSchema =
  SchemaFactory.createForClass(EventInvitation);
