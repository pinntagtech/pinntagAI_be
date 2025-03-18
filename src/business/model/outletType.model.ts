import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OutletCategory } from './outletCategory.model';
import mongoose from 'mongoose';

export type OutletTypeDocument = OutletType & Document;

@Schema()
export class OutletType {
  @Prop({ required: true })
  type: string;
  @Prop({required:true,ref:OutletCategory.name})
  OutletCategory:mongoose.Types.ObjectId;
}
export const OutletCategoryTypeSchema = SchemaFactory.createForClass(OutletType);