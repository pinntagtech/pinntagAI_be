import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type OutletCategoryDocument = OutletCategory & Document;

@Schema()
export class OutletCategory {
  @Prop({ required: true })
  title: string;
}
export const OutletCategorySchema = SchemaFactory.createForClass(OutletCategory);