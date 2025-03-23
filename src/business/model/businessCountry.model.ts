import { Prop, SchemaFactory } from '@nestjs/mongoose';

export type BusinessCountryDocument = BusinessCountry & Document;

export class BusinessCountry {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  phoneCode: string;
}
export const BusinessCountrySchema =
  SchemaFactory.createForClass(BusinessCountry);
