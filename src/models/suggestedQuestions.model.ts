// ─────────────────────────────────────────────────────────────────────────────
//  suggestedQuestions.model.ts
//
//  Per-business set of "conversation starter" chip labels shown on the review
//  chat entry screen. Generated once by an LLM from the business's profile +
//  review themes + website extract, cached, refreshed on a long TTL.
//
//  Design choice: chip labels are stored as plain short strings (2-4 words
//  each). The user taps a chip and the label is sent as-is to /review-chat/
//  chat, which already handles terse queries. Keeping the shape flat keeps
//  the frontend contract trivial.
//
//  Refresh cadence:
//    Suggestions don't change often — a business's core surface area is
//    stable. TTL = 30 days. A manual regenerate endpoint is available for
//    ops.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * Records which grounding sources were available when the chips were
 * generated, so we can spot suggestions that came from thin context (e.g.
 * business with no reviews, no website) and prioritize re-generation once
 * data lands.
 */
export interface ISuggestedQuestionsGrounding {
  hasProfileOperationalFields: boolean;
  hasReviewSummary: boolean;
  hasWebsiteSummary: boolean;
}

export interface ISuggestedQuestions extends Document {
  business: Types.ObjectId;
  /** 2-4 word chip labels, sent verbatim to /chat when tapped. */
  suggestions: string[];
  generatedAt: Date;
  modelUsed?: string;
  tokensUsed?: number;
  grounding: ISuggestedQuestionsGrounding;
  createdAt: Date;
  updatedAt: Date;
}

const GroundingSchema = new Schema<ISuggestedQuestionsGrounding>(
  {
    hasProfileOperationalFields: { type: Boolean, default: false },
    hasReviewSummary: { type: Boolean, default: false },
    hasWebsiteSummary: { type: Boolean, default: false },
  },
  { _id: false },
);

const SuggestedQuestionsSchema = new Schema<ISuggestedQuestions>(
  {
    business: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    suggestions: { type: [String], default: [] },
    generatedAt: { type: Date, required: true, default: Date.now },
    modelUsed: String,
    tokensUsed: Number,
    grounding: { type: GroundingSchema, required: true, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: "suggested_questions",
  },
);

SuggestedQuestionsSchema.index(
  { business: 1 },
  { unique: true, name: "idx_business_unique" },
);
SuggestedQuestionsSchema.index({ generatedAt: 1 }, { name: "idx_generated_at" });

export const SuggestedQuestionsModel = mongoose.model<ISuggestedQuestions>(
  "SuggestedQuestions",
  SuggestedQuestionsSchema,
);
