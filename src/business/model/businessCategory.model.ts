import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OutletCategory } from '../../outlet/model/outletCategory.model';
import mongoose from 'mongoose';
import { BusinessIndustry } from './businessIndustry.model';

export type BusinessCategoryDocument = BusinessCategory & Document;

@Schema()
export class BusinessCategory {
  @Prop({ required: true })
  type: string;
  @Prop({ required: true, ref: BusinessIndustry.name })
  industry: mongoose.Types.ObjectId;
}
export const BusinessCategorySchema =
  SchemaFactory.createForClass(BusinessCategory);
