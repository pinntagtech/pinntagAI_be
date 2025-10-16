import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Business } from "./business.model";
import mongoose, { Document } from "mongoose";

export const ActivationRequestStatus = {
  Pending: "Pending",
  Activated: "Activated",
  Rejected: "Rejected",
};

@Schema({ timestamps: true })
export class BusinessActivation extends Document {
  @Prop({ ref: Business.name })
  business: mongoose.Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  countryCode: string;
  
  @Prop()
  phone: string;

  @Prop({ enum: Object.values(ActivationRequestStatus), default: ActivationRequestStatus.Pending })
  status: string;
}

export const BusinessActivationSchema = SchemaFactory.createForClass(BusinessActivation);