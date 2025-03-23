import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Admin } from 'src/admin/models/admin.model';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import {  FileType } from 'src/enums/auth.enums';
import { Event } from 'src/event/models/event.model';
import { User } from 'src/user/models/user.model';
import { Folder } from './folder.model';
import { Drive } from './drive.model';
import { FileCategory } from './fileCategory.model';
import { BusinessUser } from 'src/business/model/businessUser.model';

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
  @Prop({ refPath: 'ParentDirectoryType' })
  parentDirectory: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: [Drive.name, Folder.name] })
  ParentDirectoryType: string;



  @Prop({ type: MetaData })
  metaData: MetaData;
  @Prop({ required: true, enum: FileType })
  fileType: string;
  @Prop({ required: true, ref:FileCategory.name })
  category: mongoose.Types.ObjectId;

  @Prop({ refPath: 'parentType' })
  parent: mongoose.Types.ObjectId;
  @Prop({
    required: true,
    enum: [User.name, Admin.name, Event.name, BusinessUser.name],
  })
  parentType: string;
  @Prop({ default: 'file' })
  entity: string;
}

export const FileSchema = SchemaFactory.createForClass(File);
