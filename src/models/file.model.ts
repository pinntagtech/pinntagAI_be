import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';


export type fileDocument = File & Document;
class MetaData {
  @Prop()
  mimeType: string;
  @Prop()
  url: string;
  @Prop()
  size: number;
  @Prop()
  originalName: string;
}

@Schema({ timestamps: true })
export class File {
  
  @Prop({type: MetaData})
  metaData: MetaData
}

export const FileSchema = SchemaFactory.createForClass(File);
