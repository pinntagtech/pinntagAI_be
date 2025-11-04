import mongoose, { Document, Schema } from "mongoose";

export const BusinessAIAssistantSchema = new Schema<IBusiness_AI_Assistant>(
  {
    businessId: {
      type: mongoose.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    businessName: { type: String, required: true },
    tags: { type: [String], default: [] },
    categories: { type: [String], default: [] },
    name: { type: String, required: true },
    description: { type: String },
    industry: { type: String },
    website: { type: String },
    contactEmail: { type: String },
    metadata: { type: Schema.Types.Mixed },
    vectorStoreId: { type: String, required: true },
    assistantId: { type: String, required: true },
    threadId: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export interface IBusiness_AI_Assistant extends Document {
  businessId: string | Schema.Types.ObjectId;
  businessName: string;
  categories: string[];
  tags?: string[];
  name: string;
  vectorStoreId: string;
  assistantId: string;
  description?: string;
  industry?: string;
  website?: string;
  contactEmail?: string;
  metadata?: Record<string, any>;
  threadId?: string;
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

// categories Array, description, tags, website, business name, business id, industry
