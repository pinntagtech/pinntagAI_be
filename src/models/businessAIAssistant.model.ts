import mongoose, { Document, Schema } from "mongoose";
import { Tone } from "../utils/types/types.js";

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
  facebookPageAccessToken?: string; // Long-lived Facebook page access token
  facebookPageId?: string; // Facebook page ID
  facebookPageTokenExpiresAt?: Date; // Token expiration date
  facebookPageName?: string; // Facebook page name
  facebookPageCategory?: string; // Facebook page category
  facebookPageProfilePicture?: string; // Facebook page profile picture URL
  facebookPageCoverPhoto?: string; // Facebook page cover photo URL
  facebookPageAbout?: string; // Facebook page about/description
  facebookPageFollowers?: number; // Number of followers
  facebookPageWebsite?: string; // Website from Facebook page
  facebookPagePhone?: string; // Phone number from Facebook page
  facebookPageEmail?: string; // Email from Facebook page
  facebookPageMetadata?: Record<string, any>; // Additional Facebook page metadata
  isFacebookConnected?: boolean; // Whether Facebook page is connected
  facebookMetaData?: {
    pageId?: string;
    pageAccessToken?: string;
    tokenExpiresAt?: Date;
    pageInfo?: {
      name?: string;
      about?: string;
      category?: string;
      followers?: number;
      website?: string;
      phone?: string;
      email?: string;
      profilePicture?: string;
      coverPhoto?: string;
    };
  };
  isFacebookDataFetched?: boolean; // Whether Facebook data has been fetched
  lastFacebookDataFetched?: Date; // Last time Facebook data was fetched
  createdAt: Date;
  updatedAt: Date;
}

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
    facebookPageAccessToken: { type: String }, // Long-lived Facebook page access token
    facebookPageId: { type: String }, // Facebook page ID
    facebookPageTokenExpiresAt: { type: Date }, // Token expiration date
    facebookPageName: { type: String }, // Facebook page name
    facebookPageCategory: { type: String }, // Facebook page category
    facebookPageProfilePicture: { type: String }, // Facebook page profile picture URL
    facebookPageCoverPhoto: { type: String }, // Facebook page cover photo URL
    facebookPageAbout: { type: String }, // Facebook page about/description
    facebookPageFollowers: { type: Number }, // Number of followers
    facebookPageWebsite: { type: String }, // Website from Facebook page
    facebookPagePhone: { type: String }, // Phone number from Facebook page
    facebookPageEmail: { type: String }, // Email from Facebook page
    facebookPageMetadata: { type: Schema.Types.Mixed }, // Additional Facebook page metadata
    isFacebookConnected: { type: Boolean, default: false }, // Whether Facebook page is connected
    facebookMetaData: {
      type: {
        pageId: { type: String },
        pageAccessToken: { type: String },
        tokenExpiresAt: { type: Date },
        pageInfo: {
          type: {
            name: { type: String },
            about: { type: String },
            category: { type: String },
            followers: { type: Number },
            website: { type: String },
            phone: { type: String },
            email: { type: String },
            profilePicture: { type: String },
            coverPhoto: { type: String },
          },
          _id: false,
        },
      },
      _id: false,
    },
    isFacebookDataFetched: { type: Boolean, default: false },
    lastFacebookDataFetched: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

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
