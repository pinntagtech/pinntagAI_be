import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { BusinessConstitution } from "./businessConstitution.model";

export type BusinessDocumentTypeDocument = BusinessDocumentType & Document;
@Schema({ timestamps: true })
export class BusinessDocumentType {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true ,ref: BusinessConstitution.name})
  constitution: mongoose.Types.ObjectId;


}

export const BusinessDocumentTypeSchema = SchemaFactory.createForClass(BusinessDocumentType);