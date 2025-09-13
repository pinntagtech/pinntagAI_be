import { Schema, model } from "mongoose";

const apiKeySchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String },
    scopes: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ApiKeyModel = model("ApiKey", apiKeySchema);
