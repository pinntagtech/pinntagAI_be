import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schedule } from './event.model';
import { CrawledEventStatus } from 'src/enums/event.enums';

export type CrawledEventDocument = CrawledEvent & Document;

@Schema()
export class CrawledEvent {
  @Prop()
  path: string;
  @Prop({ required: true })
  type: string;
  @Prop({
    required: true,
    enum: [CrawledEventStatus.CRAWLED, CrawledEventStatus.PUBLISHED],
    default: CrawledEventStatus.CRAWLED,
  })
  status: string;
  @Prop({ required: true })
  category: string;
  @Prop({ required: false })
  title: string;
  @Prop({ required: false })
  description: string;
  @Prop({ required: false })
  dates: string;
  @Prop()
  schedule: Array<Schedule>;
  @Prop()
  image: string;
  @Prop()
  address: string;
  @Prop()
  participationCost: string;
  @Prop()
  phone: string;
  @Prop()
  email: string;
  @Prop()
  website: string;
  @Prop({ type: Object, required: false })
  coordinates: Object;
  @Prop()
  offset: string;
}

export const CrawledEventSchema = SchemaFactory.createForClass(CrawledEvent);
