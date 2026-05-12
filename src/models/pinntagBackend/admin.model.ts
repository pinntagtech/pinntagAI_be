import mongoose, { Schema, Document } from "mongoose";

export const AI_CREDIT_TYPE = {
  GENERATE_TITLE: "Smart Title Generator",
  SUGGEST_TAGS: "Suggest Tags",
  GENERATE_DESCRIPTION: "Generate Description",
  IMPROVE_COPY: "Improve Copy",
  PROMO_BUNDLE: "Promo Bundle",
  CAMPAIGN_SUGGESTIONS: "Campaign Suggestions",
  REC_REFRESH: "Rec Refresh",
  AI_PROFILE_TRAIN: "AI Profile Train",
  GENERATE_TEMPLATES: "Generate Templates",
} as const;

export type AiCreditType = (typeof AI_CREDIT_TYPE)[keyof typeof AI_CREDIT_TYPE];

export interface IAdmin extends Document {
  isSuperAdmin?: boolean;
  aiCreditCost?: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    isSuperAdmin: { type: Boolean, default: false },
    aiCreditCost: { type: Schema.Types.Mixed },
  },
  {
    collection: "admins",
    timestamps: true,
    strict: false,
  }
);

export const getBackendAdminModel = (conn: mongoose.Connection) => {
  if (conn.models["Admin"]) {
    return conn.models["Admin"] as mongoose.Model<IAdmin>;
  }
  return conn.model<IAdmin>("Admin", AdminSchema, "admins");
};
