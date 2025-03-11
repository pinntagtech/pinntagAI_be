import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Drive } from './drive.model';

export type folderDocument = Folder & Document;

@Schema({ timestamps: true })
export class Folder {
  @Prop({ required: true })
  parent: mongoose.Types.ObjectId;
  @Prop({ required: true, enum: [Folder.name, Drive.name] })
  parentType: string;
  @Prop({ default: 'untitled' })
  folderName: string;
  @Prop({ default: 'directory' })
  entity: string;
}
export const folderSchema = SchemaFactory.createForClass(Folder);
