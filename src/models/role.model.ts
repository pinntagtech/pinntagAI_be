import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RoleDocument = Role & Document;
@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true })
  name: string;
  @Prop()
  description: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);