import mongoose, { Document, Schema } from "mongoose";

export interface IFacebookPost extends Document {
  businessId: string | Schema.Types.ObjectId;
  facebookPageId: string;
  postId: string; // Facebook post ID
  type: "post" | "event";
  source: "facebook_events_api" | "facebook_post_ai_extracted" | "facebook_post_raw";

  // Post/Event content
  title?: string;
  message?: string;
  story?: string;
  description?: string;

  // Media
  fullPicture?: string;
  images?: string[];
  attachments?: any[];

  // Event-specific fields
  eventData?: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    location?: {
      name?: string;
      address1?: string;
      address2?: string;
      city?: string;
      state?: string;
      country?: string;
      zipcode?: string;
      latitude?: number;
      longitude?: number;
    };
    isOnline?: boolean;
  };

  // Engagement metrics
  reactions?: number;
  comments?: number;
  shares?: number;

  // AI Analysis
  aiAnalysis?: {
    suitable: boolean;
    reason: string;
    score: number;
    type?: "event" | "offer" | "spotlight" | "flashlight";
    title?: string;
    schedule?: {
      startDate?: string;
      endDate?: string;
      startTime?: string;
      endTime?: string;
      isRecurring?: boolean;
    };
    ticketUrl?: string;
    category?: "promotion" | "event" | "product" | "service" | "announcement" | "other";
  };

  // Status tracking
  status?: "pending" | "ignored" | "saved" | "imported";
  ignoreReason?: "not_relevant" | "personal_casual" | "duplicate" | "other";
  ignoreNote?: string;

  // Metadata
  facebookCreatedTime?: Date;
  scrapedAt: Date;
  lastSyncedAt: Date;

  // Raw data from Facebook
  rawData?: any;
}

const FacebookPostSchema = new Schema<IFacebookPost>(
  {
    businessId: {
      type: mongoose.Types.ObjectId,
      required: true,
      index: true,
    },
    facebookPageId: {
      type: String,
      required: true,
      index: true,
    },
    postId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["post", "event"],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["facebook_events_api", "facebook_post_ai_extracted", "facebook_post_raw"],
      required: true,
    },

    // Post/Event content
    title: { type: String },
    message: { type: String },
    story: { type: String },
    description: { type: String },

    // Media
    fullPicture: { type: String },
    images: [{ type: String }],
    attachments: [{ type: Schema.Types.Mixed }],

    // Event-specific fields
    eventData: {
      startDate: { type: String },
      endDate: { type: String },
      startTime: { type: String },
      endTime: { type: String },
      location: {
        name: { type: String },
        address1: { type: String },
        address2: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        zipcode: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
      },
      isOnline: { type: Boolean, default: false },
    },

    // Engagement metrics
    reactions: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },

    // AI Analysis
    aiAnalysis: {
      suitable: { type: Boolean },
      reason: { type: String },
      score: { type: Number },
      type: {
        type: String,
        enum: ["event", "offer", "spotlight", "flashlight"],
      },
      title: { type: String },
      schedule: {
        startDate: { type: String },
        endDate: { type: String },
        startTime: { type: String },
        endTime: { type: String },
        isRecurring: { type: Boolean },
      },
      ticketUrl: { type: String },
      category: {
        type: String,
        enum: ["promotion", "event", "product", "service", "announcement", "other"],
      },
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "ignored", "saved", "imported"],
      default: "pending",
      index: true,
    },
    ignoreReason: {
      type: String,
      enum: ["not_relevant", "personal_casual", "duplicate", "other"],
    },
    ignoreNote: { type: String },

    // Metadata
    facebookCreatedTime: { type: Date },
    scrapedAt: { type: Date, default: Date.now },
    lastSyncedAt: { type: Date, default: Date.now },

    // Raw data from Facebook
    rawData: { type: Schema.Types.Mixed },
  },
  { timestamps: true, versionKey: false }
);

// Indexes for better query performance
FacebookPostSchema.index({ businessId: 1, type: 1 });
FacebookPostSchema.index({ facebookPageId: 1, scrapedAt: -1 });
FacebookPostSchema.index({ "aiAnalysis.category": 1 });
FacebookPostSchema.index({ "aiAnalysis.score": -1 });
FacebookPostSchema.index({ "eventData.startDate": 1 });
FacebookPostSchema.index({ scrapedAt: -1 });
FacebookPostSchema.index({ businessId: 1, status: 1 });
FacebookPostSchema.index({ businessId: 1, "aiAnalysis.type": 1, status: 1 });

// Compound index for business + page
FacebookPostSchema.index({ businessId: 1, facebookPageId: 1, postId: 1 });

// Text search index
FacebookPostSchema.index({
  title: "text",
  message: "text",
  description: "text",
});

export const FacebookPostModel = mongoose.model<IFacebookPost>(
  "Facebook_Post",
  FacebookPostSchema
);
