import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Category } from 'src/models/contentCategory.model';

export type DashboardConfigDocument = DashboardConfig & mongoose.Document;

@Schema({ timestamps: true })
export class DashboardConfig {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: false })
  offersIncluded: boolean;

  @Prop({ required: true, default: false })
  eventsIncluded: boolean;

  @Prop({ required: true, default: false })
  freeIncluded: boolean;

  @Prop({ required: true, default: 15 })
  limit: number;

  @Prop({ required: true, ref: Category.name, default: [] })
  categories: Array<mongoose.Types.ObjectId>;

  @Prop()
  sortOrder: number;
}

export const DashboardConfigSchema =
  SchemaFactory.createForClass(DashboardConfig);
