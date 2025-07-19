import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class SeederConfig extends Document{
    @Prop({required: true, default: true})
    isSeederEnabled: Boolean;
}

export const SeederConfigSchema = SchemaFactory.createForClass(SeederConfig);