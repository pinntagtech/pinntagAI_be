import mongoose, { Schema, Document } from "mongoose";

export enum CreditWalletStatus {
  ACTIVE = "active",
  SUSPENDED = "suspended",
  PAUSED = "paused",
}

export interface ICreditWallet extends Document {
  business: mongoose.Types.ObjectId;
  credits: number;
  totalCredits: number;
  creditsRenewalDate?: Date;
  status: CreditWalletStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const CreditWalletSchema = new Schema<ICreditWallet>(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      unique: true,
      index: true,
    },
    credits: { type: Number, default: 0, min: 0 },
    totalCredits: { type: Number, default: 100 },
    creditsRenewalDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(CreditWalletStatus),
      default: CreditWalletStatus.ACTIVE,
    },
  },
  {
    collection: "creditwallets",
    timestamps: true,
  }
);

export const getBackendCreditWalletModel = (conn: mongoose.Connection) => {
  if (conn.models["CreditWallet"]) {
    return conn.models["CreditWallet"] as mongoose.Model<ICreditWallet>;
  }
  return conn.model<ICreditWallet>(
    "CreditWallet",
    CreditWalletSchema,
    "creditwallets"
  );
};
