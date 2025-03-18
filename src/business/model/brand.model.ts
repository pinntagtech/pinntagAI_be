import { Schema, SchemaFactory } from '@nestjs/mongoose';

export type BrandDocument = Brand & Document;

@Schema({ timestamps: true })
export class Brand {}

export const BrandSchema = SchemaFactory.createForClass(Brand);
