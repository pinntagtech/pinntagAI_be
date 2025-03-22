import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type BusinessIndustryDocument = BusinessIndustry & Document;

@Schema()
export class BusinessIndustry {
  @Prop({ required: true })
  title: string;
}
export const BusinessIndustrySchema =
  SchemaFactory.createForClass(BusinessIndustry);
