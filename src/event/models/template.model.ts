import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { Event, Schedule } from './event.model';
import { AgeGroup } from 'src/models/ageGroup.model';
import { Category } from 'src/models/contentCategory.model';
import { Admin } from 'src/admin/models/admin.model';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { IsEnum } from 'class-validator';
import { DiscountType, EventTypes } from 'src/enums/event.enums';
import { User } from 'src/user/models/user.model';
import { BusinessIndustry } from 'src/business/model/businessIndustry.model';
import { BusinessCategory } from 'src/business/model/businessCategory.model';

export type TemplateDocument = Template & mongoose.Document;

@Schema({ timestamps: true })
export class Template {
  @Prop({ enum: [Admin.name, BusinessUser.name, User.name] })
  creatorType: string;

  @Prop({
    required: true,
    enum: [
      EventTypes.FORMAL,
      EventTypes.INFORMAL,
      EventTypes.OFFER,
      EventTypes.PRIVATE,
      EventTypes.LISTING,
    ],
  })
  type: string;

  @Prop({ refPath: 'creatorType' })
  user: mongoose.Types.ObjectId;

  @IsEnum(DiscountType, { message: 'Invalid discount type' })
  discountType: string;

  @Prop()
  discountValue: string;

  @Prop({ ref: BusinessProfile.name })
  businessProfile: mongoose.Types.ObjectId;

  @Prop({ ref: Category.name })
  categories: Array<mongoose.Types.ObjectId>;

  @Prop()
  title: string;

  @Prop()
  keywords: Array<string>;

  @Prop()
  description: string;

  @Prop()
  minTargetAge: number;

  @Prop()
  maxTargetAge: number;

  @Prop()
  targetGenders: Array<string>;

  @Prop()
  promotionCode: string;

  @Prop()
  isFree: boolean;

  @Prop()
  participationCost: string;

  @Prop()
  termsApplied: boolean;
  @Prop()
  termsAndConditions: string;

  @Prop({ref: BusinessIndustry.name})
  businessIndustry: mongoose.Types.ObjectId;

  @Prop({ref: BusinessCategory.name})
  businessCategories: Array<mongoose.Types.ObjectId>;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
