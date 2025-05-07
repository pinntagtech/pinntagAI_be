// src/department/schemas/department.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/roles/models/roles.model';
import { Business } from './business.model';

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: Role.name }],
    default: [],
  })
  roles: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: Business.name, required: true })
  business: Types.ObjectId;

  @Prop()
  createdBy: Types.ObjectId;
}

export type DepartmentDocument = Department & Document;
export const DepartmentSchema = SchemaFactory.createForClass(Department);
