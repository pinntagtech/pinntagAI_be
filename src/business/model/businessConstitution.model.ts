import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type BusinessConstitutionDocument = BusinessConstitution & Document;

export class BusinessConstitution {
  @Prop({ required: true })
  title: string;
  @Prop({required: true})
  country: mongoose.Types.ObjectId;

}

export const BusinessConstitutionSchema = SchemaFactory.createForClass(BusinessConstitution);