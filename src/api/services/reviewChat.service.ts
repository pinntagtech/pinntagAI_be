// ─────────────────────────────────────────────────────────────────────────────
//  reviewChat.service.ts
//
//  Consumer-facing review chatbot. Answers questions about a single business
//  using a cached condensed summary of its reviews + the business profile
//  as grounding context.
//
//  Two responsibilities:
//    1. getOrGenerateSummary(businessId) — ensures a fresh per-business
//       review summary exists; generates one from raw reviews if stale.
//    2. chat({ businessId, message, sessionId }) — answers a user message
//       using the summary + business profile, never invents facts.
//
//  Design notes:
//    • Reviews live in the pinntagBackend DB (read-only mirror).
//    • Summary lives in pinntagAI DB (we own it).
//    • Single-turn for v1 — no persistent conversation memory. sessionId
//       is accepted in the contract for future multi-turn support.
//    • Model: gpt-4o-mini (matches consumerAI.service.ts). Output capped
//       at 400 tokens to keep consumer responses tight + cheap.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import { openai } from "../../utils/openai.js";
import { logger } from "../../utils/logger.js";
import { getBackendConnection } from "../../db/connection.js";
import {
  getBackendReviewModel,
  IReview,
  ReviewStatus,
} from "../../models/pinntagBackend/review.model.js";
import { getBackendBusinessModel } from "../../models/pinntagBackend/business.model.js";
import {
  ReviewSummaryModel,
  IReviewSummary,
  IThemeMention,
} from "../../models/reviewSummary.model.js";

const CHAT_MODEL = "gpt-4o-mini";
const SUMMARIZATION_MODEL = "gpt-4o-mini";
const SUMMARY_TTL_HOURS = 24;
const MAX_REVIEWS_FOR_SUMMARY = 100;
const MAX_OUTPUT_TOKENS = 400;

export interface ReviewChatInput {
  businessId: string;
  message: string;
  sessionId?: string;
}

export type ReviewChatSource = "profile" | "reviews" | "none";

export interface ReviewChatResponse {
  sessionId: string;
  response: string;
  sources: ReviewChatSource[];
  abstained: boolean;
  metadata: {
    tokensUsed: number;
    summaryGenerated: boolean;
    reviewCount: number;
  };
}

/**
 * Phrases that indicate the model declined to answer. Matched case-insensitive,
 * substring. Keep this list short and obvious — false positives are cheap to fix
 * (just remove the phrase) but a missing phrase silently hides a problem.
 */
const ABSTAIN_PHRASES = [
  "i don't have",
  "i do not have",
  "i'm not sure",
  "i am not sure",
  "couldn't find",
  "could not find",
  "no information",
  "no specific information",
  "not mentioned",
  "isn't mentioned",
  "i can't answer",
  "i cannot answer",
];

function detectAbstain(answer: string): boolean {
  const lower = answer.toLowerCase();
  return ABSTAIN_PHRASES.some((p) => lower.includes(p));
}

interface BusinessSnapshot {
  name?: string;
  description?: string;
  city?: string;
  state?: string;
  category?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
}

class ReviewChatService {
  /**
   * Main chat entrypoint. Resolves business + summary, then asks the LLM
   * to answer the user's question grounded on that context.
   */
  async chat(input: ReviewChatInput): Promise<ReviewChatResponse> {
    if (!mongoose.Types.ObjectId.isValid(input.businessId)) {
      throw new Error("Invalid businessId format");
    }
    if (!input.message || input.message.trim().length === 0) {
      throw new Error("message is required");
    }

    const businessObjId = new mongoose.Types.ObjectId(input.businessId);
    const conn = await getBackendConnection();
    const BusinessModel = getBackendBusinessModel(conn);

    const business = await BusinessModel.findById(businessObjId).lean();
    if (!business) {
      throw new Error("Business not found");
    }

    const { summary, generated } =
      await this.getOrGenerateSummary(businessObjId);

    const businessSnapshot = this.buildBusinessSnapshot(business);
    const systemPrompt = this.buildSystemPrompt(businessSnapshot, summary);

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: input.message.slice(0, 2000) },
      ],
      temperature: 0.4,
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content?.trim();
    const { answer, sources } = this.parseAnswer(rawContent);
    const abstained = detectAbstain(answer);

    logger.info(
      {
        businessId: input.businessId,
        messageLength: input.message.length,
        tokensUsed: completion.usage?.total_tokens || 0,
        summaryGenerated: generated,
        sources,
        abstained,
      },
      "Review chat completed",
    );

    return {
      sessionId: input.sessionId || new mongoose.Types.ObjectId().toString(),
      response: answer,
      sources,
      abstained,
      metadata: {
        tokensUsed: completion.usage?.total_tokens || 0,
        summaryGenerated: generated,
        reviewCount: summary?.totalReviews || 0,
      },
    };
  }

  /**
   * The model is asked to respond with `{ answer: string, sources: string[] }`.
   * If the JSON is malformed or missing fields we degrade gracefully — return
   * a useful answer (or a fallback) with `sources: ["none"]` so callers can
   * still render something. Never throw from here; bad model output is normal.
   */
  private parseAnswer(raw: string | undefined): {
    answer: string;
    sources: ReviewChatSource[];
  } {
    if (!raw) {
      return {
        answer: "Sorry, I couldn't generate a response right now.",
        sources: ["none"],
      };
    }

    try {
      const parsed = JSON.parse(raw);
      const answer =
        typeof parsed.answer === "string" && parsed.answer.trim().length > 0
          ? parsed.answer.trim()
          : raw;

      const validSources: ReviewChatSource[] = ["profile", "reviews", "none"];
      const sources = Array.isArray(parsed.sources)
        ? (parsed.sources.filter((s: unknown) =>
            validSources.includes(s as ReviewChatSource),
          ) as ReviewChatSource[])
        : [];

      return {
        answer,
        sources: sources.length > 0 ? sources : ["none"],
      };
    } catch {
      // Model didn't return valid JSON. Use raw content as the answer,
      // tag sources as unknown.
      return { answer: raw, sources: ["none"] };
    }
  }

  /**
   * Returns a fresh summary for this business. If none exists or the
   * cached one is older than SUMMARY_TTL_HOURS, regenerates from raw reviews.
   */
  async getOrGenerateSummary(
    businessId: mongoose.Types.ObjectId,
  ): Promise<{ summary: IReviewSummary | null; generated: boolean }> {
    const existing = await ReviewSummaryModel.findOne({
      business: businessId,
    }).lean();

    const isFresh =
      existing &&
      Date.now() - new Date(existing.generatedAt).getTime() <
        SUMMARY_TTL_HOURS * 60 * 60 * 1000;

    if (isFresh) {
      return {
        summary: existing as unknown as IReviewSummary,
        generated: false,
      };
    }

    const summary = await this.generateSummary(businessId);
    return { summary, generated: true };
  }

  /**
   * Pulls recent reviews for a business, computes aggregate stats, then
   * asks the LLM to extract positive/negative themes and factual claims.
   * Upserts the result into ReviewSummaryModel.
   */
  async generateSummary(
    businessId: mongoose.Types.ObjectId,
  ): Promise<IReviewSummary | null> {
    const conn = await getBackendConnection();
    const ReviewModel = getBackendReviewModel(conn);

    const reviews = await ReviewModel.find({
      business: businessId,
      status: ReviewStatus.ACTIVE,
    })
      .sort({ reviewedAt: -1 })
      .limit(MAX_REVIEWS_FOR_SUMMARY)
      .lean();

    if (reviews.length === 0) {
      logger.info({ businessId }, "No reviews to summarize for business");
      return null;
    }

    const stats = this.computeStats(reviews as unknown as IReview[]);
    const themes = await this.extractThemes(reviews as unknown as IReview[]);

    const summary = await ReviewSummaryModel.findOneAndUpdate(
      { business: businessId, source: "google_maps" },
      {
        $set: {
          business: businessId,
          source: "google_maps",
          totalReviews: stats.total,
          averageRating: stats.avgRating,
          ratingDistribution: stats.distribution,
          positiveThemes: themes.positiveThemes,
          negativeThemes: themes.negativeThemes,
          factualClaims: themes.factualClaims,
          recentTrend: stats.trend,
          windowStart: stats.windowStart,
          windowEnd: stats.windowEnd,
          generatedAt: new Date(),
          generatedFromReviewIds: reviews.map((r) => r._id),
          modelUsed: SUMMARIZATION_MODEL,
          tokensUsed: themes.tokensUsed,
        },
      },
      { upsert: true, new: true },
    ).lean();

    logger.info(
      {
        businessId,
        reviewsSummarized: reviews.length,
        avgRating: stats.avgRating,
        tokensUsed: themes.tokensUsed,
      },
      "Generated review summary",
    );

    return summary as unknown as IReviewSummary;
  }

  /** Pure aggregation over the review set — no LLM call. */
  private computeStats(reviews: IReview[]) {
    const total = reviews.length;
    const distribution = { one: 0, two: 0, three: 0, four: 0, five: 0 };
    let sum = 0;
    let validRatings = 0;

    for (const r of reviews) {
      if (typeof r.rating !== "number") continue;
      sum += r.rating;
      validRatings++;
      const bucket = Math.round(r.rating);
      if (bucket === 1) distribution.one++;
      else if (bucket === 2) distribution.two++;
      else if (bucket === 3) distribution.three++;
      else if (bucket === 4) distribution.four++;
      else if (bucket === 5) distribution.five++;
    }

    const avgRating = validRatings > 0 ? sum / validRatings : 0;

    const sorted = reviews
      .filter((r) => r.reviewedAt)
      .sort(
        (a, b) =>
          new Date(a.reviewedAt!).getTime() - new Date(b.reviewedAt!).getTime(),
      );
    const windowStart = sorted[0]?.reviewedAt || new Date();
    const windowEnd = sorted[sorted.length - 1]?.reviewedAt || new Date();

    // Trend: compare avg of newest 25% vs oldest 25% (needs ≥ 20 reviews)
    let trend: IReviewSummary["recentTrend"] = "insufficient_data";
    if (sorted.length >= 20) {
      const slice = Math.floor(sorted.length / 4);
      const oldAvg =
        sorted.slice(0, slice).reduce((acc, r) => acc + (r.rating || 0), 0) /
        slice;
      const newAvg =
        sorted.slice(-slice).reduce((acc, r) => acc + (r.rating || 0), 0) /
        slice;
      const delta = newAvg - oldAvg;
      if (delta > 0.3) trend = "improving";
      else if (delta < -0.3) trend = "declining";
      else trend = "stable";
    }

    return {
      total,
      avgRating: Math.round(avgRating * 10) / 10,
      distribution,
      windowStart,
      windowEnd,
      trend,
    };
  }

  /**
   * Asks the LLM to read the raw reviews and extract structured themes
   * (positive, negative, factual claims). Returns parsed JSON.
   * Uses gpt-4o-mini for cost — runs at most once per business per day.
   */
  private async extractThemes(reviews: IReview[]): Promise<{
    positiveThemes: IThemeMention[];
    negativeThemes: IThemeMention[];
    factualClaims: string[];
    tokensUsed: number;
  }> {
    // Compact review payload: rating + text only, dropped if no text.
    const payload = reviews
      .filter((r) => r.text && r.text.length > 10)
      .map((r) => ({
        rating: r.rating ?? null,
        text: r.text!.slice(0, 400),
      }));

    if (payload.length === 0) {
      return {
        positiveThemes: [],
        negativeThemes: [],
        factualClaims: [],
        tokensUsed: 0,
      };
    }

    const systemPrompt = `You analyze customer reviews for a business and extract structured themes. Respond with ONLY valid JSON matching this exact schema:

{
  "positiveThemes": [
    { "theme": "short label (≤4 words)", "mentions": <int>, "quotes": ["<short verbatim quote>", ...] }
  ],
  "negativeThemes": [
    { "theme": "short label (≤4 words)", "mentions": <int>, "quotes": ["<short verbatim quote>", ...] }
  ],
  "factualClaims": ["concrete fact mentioned by multiple reviewers (hours, prices, amenities, policies)", ...]
}

Rules:
- Up to 8 positive themes, up to 8 negative themes
- Each theme: 1-3 verbatim quotes max, each ≤ 120 chars
- mentions = approximate count of reviews that touch this theme
- factualClaims: ONLY claims repeated by 2+ reviewers (e.g., "Charges $25 for adult ride wristbands", "Parking is paid, not free anymore"). Skip anecdotes.
- No invented facts. If you're not sure, leave it out.`;

    const userPrompt = `Reviews (JSON array):\n${JSON.stringify(payload)}`;

    try {
      const completion = await openai.chat.completions.create({
        model: SUMMARIZATION_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);

      return {
        positiveThemes: Array.isArray(parsed.positiveThemes)
          ? parsed.positiveThemes.slice(0, 8)
          : [],
        negativeThemes: Array.isArray(parsed.negativeThemes)
          ? parsed.negativeThemes.slice(0, 8)
          : [],
        factualClaims: Array.isArray(parsed.factualClaims)
          ? parsed.factualClaims.slice(0, 15)
          : [],
        tokensUsed: completion.usage?.total_tokens || 0,
      };
    } catch (error: any) {
      logger.warn(
        { error: error.message },
        "Theme extraction failed — returning empty themes",
      );
      return {
        positiveThemes: [],
        negativeThemes: [],
        factualClaims: [],
        tokensUsed: 0,
      };
    }
  }

  /** Picks profile fields the LLM needs as authoritative context. */
  private buildBusinessSnapshot(business: any): BusinessSnapshot {
    return {
      name: business.name,
      description: business.description || business.bio,
      city: business.city,
      state: business.state,
      category: business.category,
      phone: business.phone,
      website: business.website,
      rating: business.rating,
      reviewCount: business.userRatingCount,
    };
  }

  private buildSystemPrompt(
    business: BusinessSnapshot,
    summary: IReviewSummary | null,
  ): string {
    const lines: string[] = [];

    lines.push(
      `You are a helpful assistant answering questions about a specific business based on its customer reviews and profile.`,
    );
    lines.push("");
    lines.push(`# Business Profile (authoritative facts)`);
    if (business.name) lines.push(`Name: ${business.name}`);
    if (business.description)
      lines.push(`Description: ${business.description.slice(0, 300)}`);
    if (business.category) lines.push(`Category: ${business.category}`);
    if (business.city || business.state)
      lines.push(
        `Location: ${[business.city, business.state].filter(Boolean).join(", ")}`,
      );
    if (business.phone) lines.push(`Phone: ${business.phone}`);
    if (business.website) lines.push(`Website: ${business.website}`);
    if (typeof business.rating === "number")
      lines.push(
        `Overall rating: ${business.rating}/5${
          business.reviewCount ? ` (${business.reviewCount} reviews)` : ""
        }`,
      );
    lines.push("");

    if (summary) {
      lines.push(
        `# What customers say (based on ${summary.totalReviews} recent reviews)`,
      );
      lines.push(`Average rating: ${summary.averageRating}/5`);
      lines.push(
        `Distribution: 5★ ${summary.ratingDistribution.five}, 4★ ${summary.ratingDistribution.four}, 3★ ${summary.ratingDistribution.three}, 2★ ${summary.ratingDistribution.two}, 1★ ${summary.ratingDistribution.one}`,
      );
      lines.push(`Recent trend: ${summary.recentTrend}`);

      if (summary.positiveThemes.length > 0) {
        lines.push(`\n## What customers like`);
        for (const t of summary.positiveThemes) {
          lines.push(`- ${t.theme} (${t.mentions} mentions)`);
          for (const q of (t.quotes || []).slice(0, 2)) {
            lines.push(`    "${q}"`);
          }
        }
      }

      if (summary.negativeThemes.length > 0) {
        lines.push(`\n## What customers complain about`);
        for (const t of summary.negativeThemes) {
          lines.push(`- ${t.theme} (${t.mentions} mentions)`);
          for (const q of (t.quotes || []).slice(0, 2)) {
            lines.push(`    "${q}"`);
          }
        }
      }

      if (summary.factualClaims.length > 0) {
        lines.push(`\n## Facts repeated across reviews`);
        for (const f of summary.factualClaims) {
          lines.push(`- ${f}`);
        }
      }
    } else {
      lines.push(
        `# Reviews\nNo review summary available for this business yet.`,
      );
    }

    lines.push("");
    lines.push(`# Rules for your answer`);
    lines.push(
      `1. Answer ONLY from the profile and review summary above. If the answer isn't there, say so honestly — don't guess prices, hours, or policies.`,
    );
    lines.push(
      `2. Distinguish facts (from profile / repeated review claims) from opinions (what some customers said).`,
    );
    lines.push(
      `3. When sharing opinions, indicate whether the sentiment is shared by many ("most visitors mention...") or just some ("a few reviewers noted...").`,
    );
    lines.push(
      `4. Keep responses to 2-4 sentences unless the user explicitly asks for detail.`,
    );
    lines.push(
      `5. Be warm and conversational, but never invent businesses, prices, dates, or features.`,
    );
    lines.push(
      `6. If the question is unrelated to this business, politely redirect.`,
    );
    lines.push("");
    lines.push(`# Response format`);
    lines.push(
      `Respond with ONLY valid JSON matching this exact schema:`,
    );
    lines.push(
      `{ "answer": "<your reply as a string, 2-4 sentences>", "sources": ["profile" | "reviews" | "none"] }`,
    );
    lines.push(`Source tagging rules:`);
    lines.push(
      `- Include "profile" if you used the business profile section (name, phone, hours, location, website, category).`,
    );
    lines.push(
      `- Include "reviews" if you used the customer reviews section (themes, quotes, factual claims, ratings).`,
    );
    lines.push(
      `- Include "none" if you didn't use either (greeting, off-topic deflection, refusal to answer).`,
    );
    lines.push(
      `- Sources must reflect what you ACTUALLY used to construct the answer. Do not list a source just because it was provided.`,
    );

    return lines.join("\n");
  }
}

export const reviewChatService = new ReviewChatService();
