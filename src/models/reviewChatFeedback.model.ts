// ─────────────────────────────────────────────────────────────────────────────
//  reviewChatFeedback.model.ts
//
//  Thumbs up / thumbs down on a specific chat answer. Collected from day one
//  so we have signal once we build a dashboard / quality pipeline.
//
//  Identity is (messageId, userId): one rating per user per answer. Re-rating
//  the same message overwrites the previous value (handled via upsert on the
//  unique index below), so we never accumulate duplicate rows for the same
//  user+message.
//
//  Deliberately minimal — no message content. sessionId is kept as optional
//  context for joins once conversation persistence exists.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose, { Schema, Document, Types } from "mongoose";

export type FeedbackRating = "up" | "down";

export interface IReviewChatFeedback extends Document {
  messageId: string;
  business: Types.ObjectId;
  userId: string;
  rating: FeedbackRating;
  sessionId?: string;
  reason?: string;
  sources?: string[];
  abstained?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewChatFeedbackSchema = new Schema<IReviewChatFeedback>(
  {
    messageId: { type: String, required: true, index: true },
    business: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    rating: { type: String, enum: ["up", "down"], required: true },
    sessionId: { type: String },
    reason: { type: String, maxlength: 500 },
    sources: { type: [String], default: [] },
    abstained: { type: Boolean },
  },
  {
    timestamps: true,
    collection: "review_chat_feedback",
  },
);

// One rating per user per message. Re-rating overwrites via upsert on this key.
ReviewChatFeedbackSchema.index(
  { messageId: 1, userId: 1 },
  { unique: true, name: "idx_message_user_unique" },
);

// Analytics: ratings for a business over time.
ReviewChatFeedbackSchema.index(
  { business: 1, rating: 1, createdAt: -1 },
  { name: "idx_business_rating_date" },
);

export const ReviewChatFeedbackModel = mongoose.model<IReviewChatFeedback>(
  "ReviewChatFeedback",
  ReviewChatFeedbackSchema,
);
