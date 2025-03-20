import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PermissionActions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}
export enum ResourceEnums {
  USER = 'user',
  PROPERTY = 'property',
  TRANSACTION = 'transaction',
  EVENT='event',
  ADMIN = 'admin'
  // Add more resources as needed
}



export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission extends Document {
  @Prop({ type: String, enum: PermissionActions, required: true })
  action: PermissionActions;

  @Prop({ type: String, enum: ResourceEnums, required: true })
  resource: ResourceEnums;

  @Prop({ type: Boolean, default: false })
  isOnlyAdminViewable: boolean;

  @Prop({ type: Boolean, default: false })
  isOnlySuperAdminViewable: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
PermissionSchema.index({ action: 1, resource: 1 }, { unique: true });
