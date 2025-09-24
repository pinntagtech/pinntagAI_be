import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { BusinessIndustry } from 'src/business/model/businessIndustry.model';
import { Category } from './contentCategory.model';
import { BusinessCategory } from 'src/business/model/businessCategory.model';

@Schema({ timestamps: true })
export class Tag extends Document {
  @Prop()
  title: string;

  @Prop({ required: true, enum: [BusinessCategory.name, Category.name] })
  relatedTo: string;

  @Prop({ refPath: 'relatedTo' })
  relatedId: mongoose.Types.ObjectId;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
