// src/department/schemas/department.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/roles/models/roles.model';

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

  // if your departments are scoped to a particular business
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true })
  business: Types.ObjectId;
}

export type DepartmentDocument = Department & Document;
export const DepartmentSchema = SchemaFactory.createForClass(Department);
