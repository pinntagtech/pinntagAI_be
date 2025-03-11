import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Admin } from 'src/admin/models/admin.model';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { User } from 'src/user/models/user.model';

export type DriveDocument = Drive & mongoose.Document;
@Schema({ timestamps: true })
export class Drive {
  @Prop({ required: true, refPath: 'ownerType' })
  owner: mongoose.Types.ObjectId;
  @Prop({ required: true, enum: [User.name, BusinessProfile.name, Admin.name] })
  ownerType: string;
  @Prop()
  AvailableSpace: number;
  @Prop()
  TotalSpace: number;
}

export const DriveSchema = SchemaFactory.createForClass(Drive);
