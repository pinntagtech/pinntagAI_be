// src/department/schemas/department.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Role } from 'src/roles/models/roles.model';
import { Business } from './business.model';
import { BusinessUser } from './businessUser.model';

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ref: Role.name})
  roles: mongoose.Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: Business.name, required: true })
  business: Types.ObjectId;

  @Prop({ref: BusinessUser.name})
  createdBy: Types.ObjectId;
}

export type DepartmentDocument = Department & Document;
export const DepartmentSchema = SchemaFactory.createForClass(Department);
