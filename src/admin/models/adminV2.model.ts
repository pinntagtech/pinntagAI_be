import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AdminRole } from './adminRole.model';
import mongoose from 'mongoose';
import { Role } from 'src/roles/models/role.model';

export type AdminV2Document = AdminV2 & Document;

@Schema({ timestamps: true })
export class AdminV2 {
  @Prop({ default: false })
  isSuperAdmin: boolean;
 
 
  @Prop({ required: true, unique: true })
  email: string;
 
 
  @Prop({ required: true })
  password: string;
 
 
  @Prop({ required: true })
  name: string;
 
 
  @Prop()
  phone: string;
 
 
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Role.name, required: true })
  role: mongoose.Types.ObjectId;
 

  @Prop({ ref: AdminV2.name }) //will be empty for super admin
  parent: mongoose.Types.ObjectId;
}

export const AdminV2Schema = SchemaFactory.createForClass(AdminV2);


//Restrict that no admin can be created with isSuperAdmin set to true
AdminV2Schema.pre('save', function (next) {
  if (this.isSuperAdmin) {
    this.isSuperAdmin = false;
  }
  next();
 });
 
 
 //Restrict that no admin can be deleted with isSuperAdmin set to true
 AdminV2Schema.pre('deleteOne', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be deleted');
  }
  next();
 });
 
 
 AdminV2Schema.pre('deleteMany', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be deleted');
  }
  next();
 });
 
 
 AdminV2Schema.pre('findOneAndDelete', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be deleted');
  }
  next();
 });
 
 
 AdminV2Schema.pre('updateOne', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be updated');
  }
  next();
 });
 
 
 AdminV2Schema.pre('updateMany', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be updated');
  }
  next();
 });
 AdminV2Schema.pre('findOneAndUpdate', function (next) {
  if (this.getQuery().isSuperAdmin) {
    throw new Error('Super admin cannot be updated');
  }
  next();
 });
   