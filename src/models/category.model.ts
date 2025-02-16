import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CategoryDocument = Category & Document;
@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: String;
  @Prop()
  image: String;
  @Prop()
  color: String;
  @Prop({ required: true })
  description: String;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
