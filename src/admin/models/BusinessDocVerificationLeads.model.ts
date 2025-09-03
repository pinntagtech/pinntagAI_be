import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, Mongoose } from "mongoose";
import { Business } from "src/business/model/business.model";
import { BusinessUser } from "src/business/model/businessUser.model";
import { Admin } from "./admin.model";

@Schema({timestamps: true})
export class BusinessDocVerificationLeads extends Document {

    @Prop({ref: Business.name})
    businessId: mongoose.Types.ObjectId;

    @Prop({ref: BusinessUser.name})
    userId: mongoose.Types.ObjectId;

    @Prop()
    documentUrl: string;

    @Prop()
    documentType: string;

    @Prop({default: false})
    isVerified: boolean;

    // @Prop({default: false})
    // isObserved: boolean;

    @Prop({ref: Admin.name})
    verifiedBy: mongoose.Types.ObjectId;
}

export const BusinessDocVerificationLeadsSchema = SchemaFactory.createForClass(BusinessDocVerificationLeads);
