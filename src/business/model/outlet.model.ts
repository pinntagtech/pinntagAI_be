import { Schema, SchemaFactory } from '@nestjs/mongoose';

export type OutletDocument = Outlet & Document;

@Schema({ timestamps: true })
export class Outlet {}

export const OutletSchema = SchemaFactory.createForClass(Outlet);
