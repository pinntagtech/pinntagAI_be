import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type FileCategoryDocument = FileCategory & mongoose.Document;

@Schema({timestamps: true})
export class FileCategory {
    @Prop({required:true})
    name:string;
    @Prop()
    LightIcon: string;
    @Prop()
    DarkIcon: string;
}
export const FileCategorySchema = SchemaFactory.createForClass(FileCategory);