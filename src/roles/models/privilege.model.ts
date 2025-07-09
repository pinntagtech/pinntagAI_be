import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Actions, AdminResourceTypes, BusinessResourceTypes, ResourceTypes } from '../enums/roles.enum';
import { Role } from './roles.model';
import mongoose from 'mongoose';

export type PrivilegeDocument = Privilege & Document;
const AllResourceTypes = [
  ...Object.values(AdminResourceTypes),
  ...Object.values(BusinessResourceTypes),
];
@Schema({ timestamps: true })
export class Privilege {
  @Prop({ required: true, ref: Role.name })
  role: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(AllResourceTypes) })
  resource: string;

  @Prop({ enum: Object.values(Actions) })
  action: string;
}

export const PrivilegeSchema = SchemaFactory.createForClass(Privilege);
