import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum ResourceEnum {
  USER = 'user',
  PROPERTY = 'property',
  TRANSACTION = 'transaction',
  EVENT='event'
  // Add more resources as needed
}

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission extends Document {
  @Prop({ type: String, enum: PermissionAction, required: true })
  action: PermissionAction;

  @Prop({ type: String, enum: ResourceEnum, required: true })
  resource: ResourceEnum;

  @Prop({ type: Boolean, default: false })
  isOnlyAdminViewable: boolean;

  @Prop({ type: Boolean, default: false })
  isOnlySuperAdminViewable: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
PermissionSchema.index({ action: 1, resource: 1 }, { unique: true });
