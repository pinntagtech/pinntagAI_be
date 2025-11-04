import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessInfo extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  industry?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessInfoSchema = new Schema<IBusinessInfo>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    website: { type: String, required: true },
    industry: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

BusinessInfoSchema.index({ name: 1 });

export const BusinessInfoModel = mongoose.model<IBusinessInfo>(
  "BusinessInfo",
  BusinessInfoSchema
);
