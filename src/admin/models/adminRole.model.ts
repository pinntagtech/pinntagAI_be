import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// import { Permission } from './permission.model';

export type AdminRoleDocument = AdminRole & Document;

@Schema({ timestamps: true })
export class AdminRole extends Document {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }], default: [] })
  permissions: Types.ObjectId[]; // Array of permissions

  @Prop({ type: Boolean, default: false })
  isSuperAdmin: boolean;
}

export const AdminRoleSchema = SchemaFactory.createForClass(AdminRole);
