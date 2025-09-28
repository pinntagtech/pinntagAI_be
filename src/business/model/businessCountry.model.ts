import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type BusinessCountryDocument = BusinessCountry & Document;

@Schema({ timestamps: true })
export class BusinessCountry {

  @Prop({ required: true })
  isoCode: string;

  @Prop({ required: true })
  countryCode: string;

  @Prop({ required: true })
  countryName: string;

  @Prop({ required: true })
  flagImage: string;

  @Prop()
  limit: number;
}
export const BusinessCountrySchema =
  SchemaFactory.createForClass(BusinessCountry);
