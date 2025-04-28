import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Admin } from 'mongodb';
import mongoose from 'mongoose';

export type CategoryDocument = Category & Document;
@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  title: String;
  @Prop()
  lightIcon: string;
  @Prop()
  darkIcon: string;
  @Prop()
  activeColor: string;
  @Prop()
  description: String;
  @Prop({ ref: Admin.name })
  createdBy: mongoose.Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
