import mongoose, { Document, Schema } from "mongoose";
import { Tone } from "../utils/types/types.js";

export const BusinessAIAssistantSchema = new Schema<IBusiness_AI_Assistant>(
  {
    tone: { type: String, enum: Object.values(Tone) },
    businessId: {
      type: mongoose.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    businessName: { type: String, required: true },
    tags: { type: [String], default: [] },
    category: { type: String },
    subCategories: { type: [String], default: [] },
    name: { type: String, required: true },
    description: { type: String },
    website: { type: String },
    websiteData: { type: String }, // Cached website content for faster description generation
    contactEmail: { type: String },
    metadata: { type: Schema.Types.Mixed },
    vectorStoreId: { type: String, required: false },
    assistantId: { type: String, required: true },
    threadId: { type: String },
    instructions: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export interface IBusiness_AI_Assistant extends Document {
  tone?: Tone;
  businessId: string | Schema.Types.ObjectId;
  businessName: string;
  category: string;
  subCategories: string[];
  tags?: string[];
  name: string;
  vectorStoreId?: string;
  assistantId: string;
  description?: string;
  website?: string;
  websiteData?: string; // Cached website content
  contactEmail?: string;
  metadata?: Record<string, any>;
  threadId?: string;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

BusinessAIAssistantSchema.index({ industry: 1 });
BusinessAIAssistantSchema.index({ createdAt: -1 });
BusinessAIAssistantSchema.index({
  businessName: "text",
  name: "text",
  description: "text",
});

export const BusinessAIAssistantModel = mongoose.model<IBusiness_AI_Assistant>(
  "Business_AI_Assistant",
  BusinessAIAssistantSchema
);

// category,subCategories Array, description, tags, website, business name, business id, industry
