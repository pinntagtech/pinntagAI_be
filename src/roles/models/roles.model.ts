import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { RoleBelonging, RoleCreatorType } from '../enums/roles.enum';

export type RoleDocument = Role & Document;
@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ refPath: 'creatorType' })
  creator: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: Object.values(RoleCreatorType) })
  creatorType: string;
  
  @Prop({ required: true, enum: Object.values(RoleBelonging) })
  belongsTo: string;

  @Prop({ ref: 'Business' })
  business: mongoose.Types.ObjectId;

  @Prop({ default: false })
  isSuperAdmin: boolean;

  @Prop({ default: false })
  isPrimaryAdmin: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

//Protect that no role can be created with isSuperAdmin set to true and name set to 'Super Admin' or related to 'Super Admin' in any way(regex)
RoleSchema.pre('save', function (next) {
  if (this.$locals?.isSeeding) {
    return next();
  }
  if (this.isSuperAdmin || /super\sadmin/i.test(this.name)) {
    this.isSuperAdmin = false;
  }
  next();
});
