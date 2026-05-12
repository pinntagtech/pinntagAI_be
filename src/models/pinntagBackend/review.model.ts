// ─────────────────────────────────────────────────────────────────────────────
//  review.model.ts  (pinntagAI — read-only mirror of pinntagBackend "reviews")
//
//  Mirrors the source-of-truth schema defined in pinntagBackend
//  (NestJS @nestjs/mongoose). Converted to plain Mongoose so it can be
//  bound to the secondary backend connection via `getBackendReviewModel`.
//
//  IMPORTANT: pinntagAI does NOT write to this collection — it only reads.
//  Ingestion / sync lives in pinntagBackend. Keep this schema in sync if the
//  backend schema changes.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose, { Schema, Document, Types } from "mongoose";

// ── Enums ────────────────────────────────────────────────────────────────────

export enum ReviewSource {
  GOOGLE_MAPS = "google_maps",
  YELP = "yelp",
  TRIPADVISOR = "tripadvisor",
  APP_STORE_IOS = "app_store_ios",
  PLAY_STORE = "play_store",
  AMAZON = "amazon",
  TRUSTPILOT = "trustpilot",
  BOOKING = "booking",
  AIRBNB = "airbnb",
  INTERNAL = "internal",
  PINNTAG = "pinntag",
  CUSTOM = "custom",
}

export enum ReviewStatus {
  ACTIVE = "active",
  HIDDEN = "hidden",
  FLAGGED = "flagged",
  DELETED = "deleted",
  PENDING = "pending",
}

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  FILE = "file",
}

export enum SentimentLabel {
  POSITIVE = "positive",
  NEUTRAL = "neutral",
  NEGATIVE = "negative",
  MIXED = "mixed",
}

// ── Sub-document interfaces ──────────────────────────────────────────────────

export interface IReviewer {
  externalId?: string;
  displayName: string;
  profileUrl?: string;
  avatarUrl?: string;
  email?: string;
  userId?: Types.ObjectId;
  badges?: string[];
  totalReviews?: number;
  totalPhotos?: number;
  isVerified?: boolean;
  isAnonymous?: boolean;
}

export interface IMediaItem {
  type: MediaType;
  sourceUrl?: string;
  storedUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  mimeType?: string;
  caption?: string;
  capturedAt?: Date;
}

export interface IThreadMessage {
  authorName: string;
  authorRole: string;
  authorAvatarUrl?: string;
  authorUserId?: Types.ObjectId;
  text: string;
  postedAt: Date;
  isEdited?: boolean;
  editedAt?: Date;
}

export interface ISentiment {
  label?: SentimentLabel;
  score?: number;
  topics?: string[];
  aspects?: Map<string, string> | Record<string, string>;
  detectedLanguage?: string;
  modelUsed?: string;
  analyzedAt?: Date;
}

export interface ISourceMetadata {
  googleReviewId?: string;
  googlePlaceId?: string;
  googleLocalGuide?: boolean;
  yelpReviewId?: string;
  yelpBusinessId?: string;
  yelpUsefulCount?: number;
  yelpFunnyCount?: number;
  yelpCoolCount?: number;
  tripAdvisorReviewId?: string;
  tripAdvisorTravelerType?: string;
  tripAdvisorVisitType?: string;
  appStoreReviewId?: string;
  appVersion?: string;
  deviceModel?: string;
  osVersion?: string;
  amazonReviewId?: string;
  amazonAsin?: string;
  isVerifiedPurchase?: boolean;
  variantPurchased?: string;
  bookingReviewId?: string;
  roomType?: string;
  stayDuration?: string;
  travelerType?: string;
  airbnbReviewId?: string;
  listingId?: string;
  extra?: Map<string, string> | Record<string, string>;
}

export interface IReview extends Document {
  source: ReviewSource;
  business?: Types.ObjectId;
  outlet?: Types.ObjectId;
  entityId: string;
  entityType: string;
  entityName?: string;
  externalReviewId?: string;
  sourceUrl?: string;
  reviewer: IReviewer;
  rating?: number;
  rawRating?: number;
  rawRatingMax?: number;
  title?: string;
  text?: string;
  originalText?: string;
  language?: string;
  attributes?: Map<string, number> | Record<string, number>;
  priceRange?: string;
  likesCount?: number;
  dislikesCount?: number;
  helpfulCount?: number;
  reportCount?: number;
  shareCount?: number;
  media?: IMediaItem[];
  thread?: IThreadMessage[];
  reviewedAt?: Date;
  reviewedAtRaw?: string;
  lastSyncedAt?: Date;
  status: ReviewStatus;
  tags?: string[];
  category?: string;
  metadata?: ISourceMetadata;
  sentiment?: ISentiment;
  isSpam?: boolean;
  isFeatured?: boolean;
  moderationNote?: string;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const ReviewerSchema = new Schema<IReviewer>(
  {
    externalId: { type: String, index: true },
    displayName: { type: String, required: true },
    profileUrl: String,
    avatarUrl: String,
    email: String,
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    badges: { type: [String], default: [] },
    totalReviews: Number,
    totalPhotos: Number,
    isVerified: { type: Boolean, default: false },
    isAnonymous: { type: Boolean, default: false },
  },
  { _id: false }
);

const MediaItemSchema = new Schema<IMediaItem>(
  {
    type: { type: String, enum: Object.values(MediaType), required: true },
    sourceUrl: String,
    storedUrl: String,
    thumbnailUrl: String,
    width: Number,
    height: Number,
    fileSizeBytes: Number,
    mimeType: String,
    caption: String,
    capturedAt: Date,
  },
  { _id: false }
);

const ThreadMessageSchema = new Schema<IThreadMessage>(
  {
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    authorAvatarUrl: String,
    authorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    postedAt: { type: Date, required: true, default: Date.now },
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
  },
  { _id: false }
);

const SentimentSchema = new Schema<ISentiment>(
  {
    label: { type: String, enum: Object.values(SentimentLabel) },
    score: { type: Number, min: 0, max: 1 },
    topics: { type: [String], default: [] },
    aspects: { type: Map, of: String },
    detectedLanguage: String,
    modelUsed: String,
    analyzedAt: Date,
  },
  { _id: false }
);

const SourceMetadataSchema = new Schema<ISourceMetadata>(
  {
    googleReviewId: String,
    googlePlaceId: String,
    googleLocalGuide: Boolean,
    yelpReviewId: String,
    yelpBusinessId: String,
    yelpUsefulCount: Number,
    yelpFunnyCount: Number,
    yelpCoolCount: Number,
    tripAdvisorReviewId: String,
    tripAdvisorTravelerType: String,
    tripAdvisorVisitType: String,
    appStoreReviewId: String,
    appVersion: String,
    deviceModel: String,
    osVersion: String,
    amazonReviewId: String,
    amazonAsin: String,
    isVerifiedPurchase: Boolean,
    variantPurchased: String,
    bookingReviewId: String,
    roomType: String,
    stayDuration: String,
    travelerType: String,
    airbnbReviewId: String,
    listingId: String,
    extra: { type: Map, of: String },
  },
  { _id: false }
);

// ── Root schema ──────────────────────────────────────────────────────────────

const ReviewSchema = new Schema<IReview>(
  {
    source: {
      type: String,
      enum: Object.values(ReviewSource),
      required: true,
      index: true,
    },
    business: { type: Schema.Types.ObjectId, ref: "Business", index: true },
    outlet: { type: Schema.Types.ObjectId, ref: "Outlet", index: true },
    entityId: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityName: String,
    externalReviewId: { type: String, index: true },
    sourceUrl: String,

    reviewer: { type: ReviewerSchema, required: true },

    rating: { type: Number, min: 0, max: 5, index: true },
    rawRating: Number,
    rawRatingMax: Number,
    title: String,
    text: String,
    originalText: String,
    language: { type: String, index: true },

    attributes: { type: Map, of: Number, default: {} },
    priceRange: String,

    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    helpfulCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },

    media: { type: [MediaItemSchema], default: [] },
    thread: { type: [ThreadMessageSchema], default: [] },

    reviewedAt: { type: Date, index: true },
    reviewedAtRaw: String,
    lastSyncedAt: { type: Date, index: true },

    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.ACTIVE,
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    category: { type: String, index: true },

    metadata: { type: SourceMetadataSchema, default: {} },
    sentiment: SentimentSchema,

    isSpam: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    moderationNote: String,
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: Date,
  },
  {
    timestamps: true,
    collection: "reviews",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ReviewSchema.index(
  { source: 1, externalReviewId: 1 },
  { unique: true, sparse: true, name: "idx_dedup_source_external" }
);
ReviewSchema.index(
  { business: 1, status: 1, reviewedAt: -1 },
  { name: "idx_business_status_date" }
);
ReviewSchema.index(
  { entityId: 1, source: 1, reviewedAt: -1 },
  { name: "idx_entity_source_date" }
);

// ── Connection-bound model factory ───────────────────────────────────────────
// pinntagAI uses a secondary connection to the backend DB where reviews live.
// Use getBackendReviewModel(conn) — do NOT mongoose.model() on the default
// connection, otherwise you'll write to the wrong database.

export const getBackendReviewModel = (conn: mongoose.Connection) => {
  if (conn.models["Review"]) {
    return conn.models["Review"] as mongoose.Model<IReview>;
  }
  return conn.model<IReview>("Review", ReviewSchema, "reviews");
};

export type ReviewBackend = IReview;
