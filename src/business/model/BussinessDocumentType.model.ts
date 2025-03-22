import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type BusinessDocumentTypeDocument = BusinessDocumentType & Document;

export class BusinessDocumentType {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  constitution: mongoose.Types.ObjectId;


}

export const BusinessDocumentTypeSchema = SchemaFactory.createForClass(BusinessDocumentType);