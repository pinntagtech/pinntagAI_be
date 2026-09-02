// ─────────────────────────────────────────────────────────────────────────────
//  websiteSummary.model.ts
//
//  Per-business condensed extract of the business's own website, used as
//  additional grounding for the consumer review chatbot alongside reviews +
//  profile. One document per business.
//
//  Why cache a website extract instead of scraping live?
//    Live scraping on every chat is slow (~2-5s), fails a lot (429s, timeouts,
//    JS-only pages), and burns tokens re-summarizing the same content. We
//    scrape once, LLM-extract into ≤ 3 KB of structured facts, cache, refresh
//    on a TTL. Same pattern as reviewSummary.
//
//  Status field:
//    - "ok"            — extract completed, has usable content
//    - "fetch_failed"  — HTTP error / timeout / blocked host (see error field)
//    - "no_content"    — fetched successfully but nothing extractable
//    - "extract_failed"— LLM extract failed / returned unusable output
//    Non-"ok" rows are still written so we don't retry on every chat.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWebsiteFaq {
  q: string;
  a: string;
}

export type WebsiteSummaryStatus =
  | "ok"
  | "fetch_failed"
  | "no_content"
  | "extract_failed";

export interface IWebsiteSummary extends Document {
  business: Types.ObjectId;

  /** The URL we actually fetched (may differ from business.website if it
   *  changed since we last generated). Empty string when status !== "ok". */
  sourceUrl: string;

  /** When the raw HTML was fetched (may differ from extractedAt if the
   *  LLM call failed and we re-tried later). */
  fetchedAt?: Date;

  /** Size of the raw response we ingested, for observability. */
  contentBytes?: number;

  /** When the structured extract below was written. */
  extractedAt: Date;

  // ── Structured extract (all optional — a real website may not have all) ──
  /** 1-3 sentence "what this business is / does". */
  aboutSummary?: string;
  /** Services / offerings the business explicitly lists on its site. */
  services: string[];
  /** Hours as published on the site, if present (free-form text). */
  hoursText?: string;
  /** Policies: returns, dress code, cancellations, age limits, etc. */
  policies: string[];
  /** Q&A pairs pulled from a site FAQ. */
  faqs: IWebsiteFaq[];
  /** Address the site lists publicly (may or may not match profile). */
  address?: string;
  /** Phone the site lists publicly (may or may not match profile). */
  phone?: string;
  /** Catch-all facts that don't fit the other buckets. */
  otherFacts: string[];

  status: WebsiteSummaryStatus;
  errorMessage?: string;

  modelUsed?: string;
  tokensUsed?: number;

  createdAt: Date;
  updatedAt: Date;
}

const WebsiteFaqSchema = new Schema<IWebsiteFaq>(
  {
    q: { type: String, required: true },
    a: { type: String, required: true },
  },
  { _id: false },
);

const WebsiteSummarySchema = new Schema<IWebsiteSummary>(
  {
    business: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    sourceUrl: { type: String, default: "" },
    fetchedAt: Date,
    contentBytes: Number,

    extractedAt: { type: Date, required: true, default: Date.now },

    aboutSummary: String,
    services: { type: [String], default: [] },
    hoursText: String,
    policies: { type: [String], default: [] },
    faqs: { type: [WebsiteFaqSchema], default: [] },
    address: String,
    phone: String,
    otherFacts: { type: [String], default: [] },

    status: {
      type: String,
      enum: ["ok", "fetch_failed", "no_content", "extract_failed"],
      required: true,
    },
    errorMessage: String,

    modelUsed: String,
    tokensUsed: Number,
  },
  {
    timestamps: true,
    collection: "website_summaries",
  },
);

WebsiteSummarySchema.index(
  { business: 1 },
  { unique: true, name: "idx_business_unique" },
);
WebsiteSummarySchema.index({ extractedAt: 1 }, { name: "idx_extracted_at" });

export const WebsiteSummaryModel = mongoose.model<IWebsiteSummary>(
  "WebsiteSummary",
  WebsiteSummarySchema,
);
