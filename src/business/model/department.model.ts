// src/department/schemas/department.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { Role } from 'src/roles/models/roles.model';
import { Business } from './business.model';
import { BusinessUser } from './businessUser.model';
import { RegionCreatorType } from '../enums/business.enum';

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ ref: Role.name })
  roles: mongoose.Types.ObjectId[];

  @Prop({ ref: Business.name })
  business: mongoose.Types.ObjectId;

  @Prop({ refPath: 'creatorType' })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(RegionCreatorType) })
  creatorType: string;
}

export type DepartmentDocument = Department & Document;
export const DepartmentSchema = SchemaFactory.createForClass(Department);
