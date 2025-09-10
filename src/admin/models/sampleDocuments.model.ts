import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Admin } from "./admin.model";
import { Document } from "mongoose";


@Schema({timestamps: true})
export class SampleDocument extends Document {
    @Prop({ required: true})
    title: string;

    @Prop()
    description: string;

    @Prop({ref: Admin.name})
    createdBy: mongoose.Types.ObjectId;

    @Prop()
    file: string;
}

export const SampleDocumentSchema = SchemaFactory.createForClass(SampleDocument);