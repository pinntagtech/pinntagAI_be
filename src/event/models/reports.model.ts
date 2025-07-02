import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ReportTypes } from 'src/enums/event.enums';
import { Event } from './event.model';

export type ReportDocument = Report & Document;
@Schema({ timestamps: true })
export class Report {
  @Prop({ required: true, ref: 'User' })
  user: mongoose.Types.ObjectId;

  @Prop({ required: true, ref: Event.name })
  event: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    enum: ReportTypes,
  })
  type: string;

  @Prop()
  description: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
