import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AdminRole } from './adminRole.model';
import mongoose from 'mongoose';

export type AdminV2Document = AdminV2 & Document;

@Schema({ timestamps: true })
export class AdminV2 {
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ unique: true, sparse: true })
  email: string;

  @Prop({ default: null })
  password: string;

  @Prop({ required: true, ref: AdminRole.name })
  role: mongoose.Types.ObjectId;
}

export const AdminV2Schema = SchemaFactory.createForClass(AdminV2);
