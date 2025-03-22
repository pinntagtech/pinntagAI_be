import { Prop, SchemaFactory } from "@nestjs/mongoose";

export type CountryDocument = Country & Document;

export class Country {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  currencySymbol: string;

  @Prop({ required: true })
  phoneCode: string;

}
export const CountrySchema = SchemaFactory.createForClass(Country);