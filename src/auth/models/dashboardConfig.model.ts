import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { CarouselType } from 'src/enums/auth.enums';
import { Category } from 'src/models/contentCategory.model';

export type DashboardConfigDocument = DashboardConfig & mongoose.Document;

@Schema({ timestamps: true })
export class DashboardConfig {
  @Prop()
  name: string;

  @Prop({ default: false })
  offersIncluded: boolean;

  @Prop({ default: false })
  eventsIncluded: boolean;

  @Prop({ default: false })
  flashOffersIncluded: boolean;

  @Prop({ default: false })
  freeIncluded: boolean;

  @Prop({ required: true, default: 15 })
  limit: number;

  @Prop({  ref: Category.name, default: [] })
  categories: Array<mongoose.Types.ObjectId>;

  @Prop({enum: ['xl', 'xxl','zoom','full']})
  cardType: string;

  @Prop()
  sortOrder: number;

  @Prop()
  businessIndustries: Array<mongoose.Types.ObjectId>;

  @Prop({ enum: [CarouselType.Event, CarouselType.Business, CarouselType.OnWheels], required: true })
  carouselType: string;
}

export const DashboardConfigSchema =
  SchemaFactory.createForClass(DashboardConfig);
