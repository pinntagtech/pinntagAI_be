// ─────────────────────────────────────────────────────────────────────────────
//  reviewChatFeedback.model.ts
//
//  Thumbs up / thumbs down on review chat responses. Collected from day one
//  so we have signal once we build a dashboard / quality pipeline.
//
//  Deliberately minimal — no message content, no PII. We can join on
//  sessionId later if we add conversation persistence.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReviewChatFeedback extends Document {
  sessionId: string;
  business: Types.ObjectId;
  rating: 1 | -1;
  reason?: string;
  sources?: string[];
  abstained?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewChatFeedbackSchema = new Schema<IReviewChatFeedback>(
  {
    sessionId: { type: String, required: true, index: true },
    business: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    rating: { type: Number, enum: [1, -1], required: true },
    reason: { type: String, maxlength: 500 },
    sources: { type: [String], default: [] },
    abstained: { type: Boolean },
  },
  {
    timestamps: true,
    collection: "review_chat_feedback",
  },
);

ReviewChatFeedbackSchema.index(
  { business: 1, rating: 1, createdAt: -1 },
  { name: "idx_business_rating_date" },
);

export const ReviewChatFeedbackModel = mongoose.model<IReviewChatFeedback>(
  "ReviewChatFeedback",
  ReviewChatFeedbackSchema,
);
