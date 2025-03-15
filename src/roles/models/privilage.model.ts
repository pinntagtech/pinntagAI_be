import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Actions, ResourceTypes } from "../enums/roles.enum";

export type PrivilegeDocument = Privilege & Document;


@Schema({ timestamps: true })
export class Privilege {
 @Prop()
 name: string;


 @Prop()
 description: string;


 @Prop({ required: true, enum: Object.values(ResourceTypes) })
 resource: string;


 @Prop({ enum: Object.values(Actions) })
 action: string;
}


export const PrivilegeSchema = SchemaFactory.createForClass(Privilege);