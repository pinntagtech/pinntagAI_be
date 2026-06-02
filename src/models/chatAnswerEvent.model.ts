// ─────────────────────────────────────────────────────────────────────────────
//  chatAnswerEvent.model.ts
//
//  One row per LLM-answered chat request (cache misses only — see note below).
//  Records whether the bot abstained, so we can compute the abstain RATE
//  (abstained / total) per business and overall, queryable by date range.
//
//  Why log every answer, not just abstentions:
//    A rate needs a denominator. Logging only `abstained: true` rows gives us
//    the numerator but no total. So each answered request writes one row with
//    the `abstained` boolean; the rate is count(abstained) / count(all).
//
//  PII policy (hard requirement):
//    We store the QUESTION text (it's the searchable signal we need) and the
//    businessId. We do NOT store userId, sessionId, IP, or anything that links
//    a question to a person. An unlinked question is not PII.
//
//  Cache hits are intentionally NOT logged here: they're repeat questions that
//  never hit the model, and counting them would skew the rate toward popular
//  questions rather than measuring model behavior.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChatAnswerEvent extends Document {
  business: Types.ObjectId;
  /** The user's question. No user identity is attached. */
  question: string;
  abstained: boolean;
  sources: string[];
  /** When the answer was produced. Indexed for date-range queries. */
  answeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatAnswerEventSchema = new Schema<IChatAnswerEvent>(
  {
    business: { type: Schema.Types.ObjectId, required: true, index: true },
    question: { type: String, required: true, maxlength: 2000 },
    abstained: { type: Boolean, required: true, index: true },
    sources: { type: [String], default: [] },
    answeredAt: { type: Date, required: true, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: "chat_answer_events",
  },
);

// Primary analytics access pattern: a business's events over a time window,
// split by abstained.
ChatAnswerEventSchema.index(
  { business: 1, answeredAt: -1 },
  { name: "idx_business_answered" },
);
// Overall (all-business) rate over a window.
ChatAnswerEventSchema.index(
  { answeredAt: -1, abstained: 1 },
  { name: "idx_answered_abstained" },
);

export const ChatAnswerEventModel = mongoose.model<IChatAnswerEvent>(
  "ChatAnswerEvent",
  ChatAnswerEventSchema,
);
