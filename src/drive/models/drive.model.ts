import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Admin } from 'src/admin/models/admin.model';
import { Business } from 'src/business/model/business.model';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { User } from 'src/user/models/user.model';

export type DriveDocument = Drive & mongoose.Document;
@Schema({ timestamps: true })
export class Drive {
  @Prop({ required: true, refPath: 'ownerType' })
  owner: mongoose.Types.ObjectId;
  @Prop({ required: true, enum: [User.name, BusinessUser.name, Admin.name, 'Business'] })
  ownerType: string;
  @Prop()
  AvailableSpace: number;
  @Prop()
  TotalSpace: number;
}

export const DriveSchema = SchemaFactory.createForClass(Drive);
