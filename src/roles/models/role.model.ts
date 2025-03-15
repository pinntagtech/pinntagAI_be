import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export type RoleDocument = Role & Document;
@Schema({ timestamps: true })
export class Role {
 @Prop({ required: true })
 name: string;


 @Prop()
 description: string;


 @Prop({ refPath: 'creatorType' })
 creator: string;


 @Prop({ required: true, enum: ['Admin', 'User', 'System'] })
 creatorType: string;


 @Prop({ default: false })
 belongsToBusiness: boolean;


 @Prop({ default: false })
 belongsToSystem: boolean;


 @Prop({ default: false })
 isSuperAdmin: boolean;


 @Prop({ default: false })
 isPrimaryAdmin: boolean;


 @Prop({ ref: 'Privilege', default: [] })
 privileges: mongoose.Types.ObjectId[];
}


export const RoleSchema = SchemaFactory.createForClass(Role);


//Protect that no role can be created with isSuperAdmin set to true and name set to 'Super Admin' or related to 'Super Admin' in any way(regex)
RoleSchema.pre('save', function (next) {
 if (this.isSuperAdmin || /super\sadmin/i.test(this.name)) {
   this.isSuperAdmin = false;
 }
 next();
});
