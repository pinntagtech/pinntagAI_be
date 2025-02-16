import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type ContactUsDocument = ContactUs & Document;
@Schema({ timestamps: true })
export class ContactUs {
  @Prop({ ref: 'User' })
  user: mongoose.Types.ObjectId;
  @Prop()
  name: string;
  @Prop()
  email: string;
  @Prop()
  description: string;
}

export const ContactUsSchema = SchemaFactory.createForClass(ContactUs);
