import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Actions } from "../enums/roles.enum";

export type ActionDocument = Action & Document;
@Schema()
export class Action {
    @Prop({required:true,enum:Object.values(Actions)})
    title:string
}

export const ActionSchema = SchemaFactory.createForClass(Action);