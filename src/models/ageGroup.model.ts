import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type AgeGroupDocument = AgeGroup & Document;
@Schema({ timestamps: true })
export class AgeGroup {
  @Prop({ required: true })
  name: String;

  @Prop()
  minAge: Number;

  @Prop()
  maxAge: Number;

  @Prop()
  image: String;
  @Prop()
  description: String;
  @Prop()
  sortOrder: Number;
}

export const AgeGroupSchema = SchemaFactory.createForClass(AgeGroup);
