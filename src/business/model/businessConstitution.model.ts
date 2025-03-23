import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { BusinessCountry } from './businessCountry.model';

export type BusinessConstitutionDocument = BusinessConstitution & Document;

@Schema({ timestamps: true })
export class BusinessConstitution {
  @Prop({ required: true })
  title: string;
  @Prop({ required: true, ref: BusinessCountry.name })
  country: mongoose.Types.ObjectId;
}

export const BusinessConstitutionSchema =
  SchemaFactory.createForClass(BusinessConstitution);
