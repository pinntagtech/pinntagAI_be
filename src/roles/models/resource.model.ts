import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ResourceDocument = Resource & Document;

@Schema()
export class Resource {
  @Prop({ required: true })
  title: string;
}
export const ResourceSchema = SchemaFactory.createForClass(Resource);