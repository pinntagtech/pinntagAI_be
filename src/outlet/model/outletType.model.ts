import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OutletCategory } from './outletCategory.model';
import mongoose from 'mongoose';

export type OutletTypeDocument = OutletType & Document;

@Schema({timestamps: true})
export class OutletType {
  @Prop({ required: true })
  type: string;
  @Prop({ required: true, ref: OutletCategory.name })
  category: mongoose.Types.ObjectId;
}
export const OutletTypeSchema = SchemaFactory.createForClass(OutletType);
