import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// import { Permission } from './permission.model';

export type BusinessRoleDocument = BusinessRole & Document;

@Schema({ timestamps: true })
export class BusinessRole extends Document {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }], default: [] })
  permissions: Types.ObjectId[]; // Array of permissions

  @Prop({ type: Boolean, default: false })
  isParent: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Business' })
  businessId: Types.ObjectId;
}

export const BusinessRoleSchema = SchemaFactory.createForClass(BusinessRole);
