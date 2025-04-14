import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Admin } from 'src/admin/models/admin.model';

export type BusinessIndustryDocument = BusinessIndustry & Document;

@Schema({ timestamps: true })
export class BusinessIndustry {
  @Prop({ required: true })
  title: string;

  @Prop()
  lightIcon: string;
  @Prop()
  darkIcon: string;
  @Prop()
  activeColor: string;
  @Prop()
  @Prop({ ref: Admin.name })
  createdBy: mongoose.Types.ObjectId;
}
export const BusinessIndustrySchema =
  SchemaFactory.createForClass(BusinessIndustry);
