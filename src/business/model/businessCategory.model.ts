import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OutletCategory } from '../../outlet/model/outletCategory.model';
import mongoose from 'mongoose';
import { BusinessIndustry } from './businessIndustry.model';
import { Admin } from 'src/admin/models/admin.model';

export type BusinessCategoryDocument = BusinessCategory & Document;

@Schema({ timestamps: true })
export class BusinessCategory {
  @Prop({ required: true })
  type: string;
  @Prop({ required: true, ref: BusinessIndustry.name })
  industry: mongoose.Types.ObjectId;

  @Prop()
  lightIcon: string;
  @Prop()
  darkIcon: string;
  @Prop()
  activeColor: string;

  @Prop({ ref: Admin.name })
  createdBy: mongoose.Types.ObjectId;
}
export const BusinessCategorySchema =
  SchemaFactory.createForClass(BusinessCategory);
