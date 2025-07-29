import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export class Menu extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ ref: 'Folder' })
  drivePath: mongoose.Types.ObjectId;
}


export const MenuSchema = SchemaFactory.createForClass(Menu);