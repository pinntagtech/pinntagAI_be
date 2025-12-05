import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Mongoose } from 'mongoose';
import { Business } from 'src/business/model/business.model';
import { BusinessUser } from 'src/business/model/businessUser.model';
import { Admin } from './admin.model';
import { VerificationStatus } from 'src/business/enums/business.enum';
import { REQUEST } from '@nestjs/core';


export const ADMIN_ACTION_STATUS = {
    ACCEPT: 'Accept',
    REJECT: 'Reject',
    REQUEST_REVERIFICATION: 'Request Reverification',
}
@Schema({ timestamps: true })
export class BusinessDocVerificationLeads extends Document {
  @Prop({ ref: Business.name })
  businessId: mongoose.Types.ObjectId;

  @Prop({ ref: BusinessUser.name })
  userId: mongoose.Types.ObjectId;

  @Prop()
  documentUrls: string[];

  @Prop()
  documentType: string;

  @Prop({
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
  })
  verificationStatus: string;

  @Prop()
  remarks: string;

  // @Prop({default: false})
  // isObserved: boolean;

  @Prop({ ref: Admin.name })
  verifiedBy: mongoose.Types.ObjectId;
}

export const BusinessDocVerificationLeadsSchema = SchemaFactory.createForClass(
  BusinessDocVerificationLeads,
);
