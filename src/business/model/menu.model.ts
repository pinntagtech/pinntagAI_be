import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { Document,  } from 'mongoose';
import { File } from 'src/drive/models/file.model';

@Schema({ timestamps: true })
export class Menu extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  business: mongoose.Types.ObjectId;

  @Prop({ ref: 'BusinessUser' })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ ref: 'File' })
  images: Array<mongoose.Types.ObjectId>; // Array of image references
}


export const MenuSchema = SchemaFactory.createForClass(Menu);