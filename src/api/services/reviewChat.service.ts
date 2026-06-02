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
import { llm } from "../../utils/llm.js";
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
import { cacheGet, cacheSet } from "../../utils/redis.js";
import { ChatAnswerEventModel } from "../../models/chatAnswerEvent.model.js";

const CHAT_MODEL = "gpt-4o-mini";
const SUMMARIZATION_MODEL = "gpt-4o-mini";
const SUMMARY_TTL_HOURS = 24;
const MAX_REVIEWS_FOR_SUMMARY = 100;
const MAX_OUTPUT_TOKENS = 400;

// Exact-match answer cache. Same business + same (normalized) question returns
// the stored answer for 24h, bypassing the LLM entirely.
const ANSWER_CACHE_TTL_SECONDS = 24 * 60 * 60;
const ANSWER_CACHE_PREFIX = "reviewchat:answer";

// Abstain-rate health band. Below LOW → model may be hallucinating (answering
// things it shouldn't). Above HIGH → missing context / over-cautious. Either
// edge is flagged for attention.
const ABSTAIN_RATE_LOW = 0.05; // 5%
const ABSTAIN_RATE_HIGH = 0.3; // 30%

// Shape we persist in the cache — everything needed to reconstruct the
// response except sessionId (fresh per request).
interface CachedAnswer {
  response: string;
  sources: ReviewChatSource[];
  abstained: boolean;
  reviewCount: number;
  /** Business phone, cached so abstain hits can surface the fallback too. */
  phone?: string;
}

/**
 * Cache key: businessId + the question lowercased and trimmed. Collapsing
 * internal whitespace too so "what time   do they close?" and "what time do
 * they close?" hit the same entry.
 */
function answerCacheKey(businessId: string, question: string): string {
  const normalized = question.trim().toLowerCase().replace(/\s+/g, " ");
  return `${ANSWER_CACHE_PREFIX}:${businessId}:${normalized}`;
}

// ── Summary size + shape budget ──────────────────────────────────────────────
// Acceptance criteria: structured summary stays ≤ 2-3 KB. We enforce this
// twice: the prompt asks the model to stay within budget, and validateAndClamp
// hard-trims if it doesn't. Caps below keep us comfortably under 3 KB.
const MAX_THEMES = 5; // top 5 positive, top 5 negative
const MAX_QUOTES_PER_THEME = 2;
const MAX_QUOTE_CHARS = 120;
const MAX_THEME_LABEL_CHARS = 40;
const MAX_FACTUAL_CLAIMS = 10;
const MAX_FACTUAL_CLAIM_CHARS = 140;
const MAX_SUMMARY_BYTES = 3000; // hard cap on the serialized themes block

type OverallSentiment = "positive" | "mixed" | "negative" | "neutral";

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
  /**
   * Business phone for the user to call, populated ONLY when the bot abstained
   * AND the business has a phone on file. Lets the UI render a "call them"
   * fallback instead of leaving the user stuck. Undefined otherwise.
   */
  phoneFallback?: string;
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
  // Real-time / live-info abstentions (today's special, current wait, etc.)
  "don't have current",
  "do not have current",
  "don't have up-to-date",
  "don't have real-time",
  "can't check",
  "cannot check",
  "recommend calling",
  "best to call",
  "call the business",
  "call them directly",
  "call the restaurant",
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

    // ── Exact-match answer cache ────────────────────────────────────────────
    // If the same business was asked the same (normalized) question within the
    // TTL, return the stored answer and skip the DB lookups + LLM call entirely.
    // Cache failures never block the request — cacheGet returns null on any
    // error, so we just fall through to the live path.
    const cacheKey = answerCacheKey(input.businessId, input.message);
    const cachedRaw = await cacheGet(cacheKey);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as CachedAnswer;
        logger.info(
          { businessId: input.businessId, cacheHit: true },
          "Review chat served from cache",
        );
        return {
          sessionId:
            input.sessionId || new mongoose.Types.ObjectId().toString(),
          response: cached.response,
          sources: cached.sources,
          abstained: cached.abstained,
          phoneFallback: this.phoneFallbackFor(cached.abstained, cached.phone),
          metadata: {
            tokensUsed: 0, // no LLM call on a cache hit
            summaryGenerated: false,
            reviewCount: cached.reviewCount,
          },
        };
      } catch {
        // Corrupt cache entry — ignore it and fall through to the live path.
        logger.warn(
          { businessId: input.businessId, cacheKey },
          "Discarding malformed cached answer",
        );
      }
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

    const completion = await llm.chatCompletion({
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
    const { answer, sources: rawSources } = this.parseAnswer(rawContent);
    const abstained = detectAbstain(answer);
    // Enforce the provenance contract in code rather than trusting the model:
    // an abstained answer ALWAYS reports sources ["none"], even if the model
    // mis-tagged it. Keeps abstained:true and sources:["none"] consistent.
    const sources: ReviewChatSource[] = abstained ? ["none"] : rawSources;
    const reviewCount = summary?.totalReviews || 0;

    const answeredAt = new Date();

    logger.info(
      {
        businessId: input.businessId,
        // The question is logged for abstain monitoring. No user identity
        // (userId/sessionId/IP) is attached anywhere — an unlinked question
        // is not PII.
        question: input.message.slice(0, 2000),
        tokensUsed: completion.usage?.total_tokens || 0,
        summaryGenerated: generated,
        sources,
        abstained,
        answeredAt,
        cacheHit: false,
      },
      "Review chat completed",
    );

    // Persist the answer outcome for abstain-rate monitoring. One row per
    // model-answered request (cache misses only). Write is best-effort — a
    // logging-store failure must never break the user's answer.
    void ChatAnswerEventModel.create({
      business: businessObjId,
      question: input.message.slice(0, 2000),
      abstained,
      sources,
      answeredAt,
    }).catch((err: any) =>
      logger.warn(
        { error: err.message, businessId: input.businessId },
        "Failed to record chat answer event (abstain monitoring)",
      ),
    );

    // Store the answer for identical future questions. Fire-and-forget-ish:
    // cacheSet swallows its own errors, so a Redis failure here can't break
    // the response we already computed. Phone is cached so abstain hits can
    // surface the call-them fallback without re-fetching the business.
    const toCache: CachedAnswer = {
      response: answer,
      sources,
      abstained,
      reviewCount,
      phone: businessSnapshot.phone,
    };
    await cacheSet(cacheKey, JSON.stringify(toCache), ANSWER_CACHE_TTL_SECONDS);

    return {
      sessionId: input.sessionId || new mongoose.Types.ObjectId().toString(),
      response: answer,
      sources,
      abstained,
      phoneFallback: this.phoneFallbackFor(abstained, businessSnapshot.phone),
      metadata: {
        tokensUsed: completion.usage?.total_tokens || 0,
        summaryGenerated: generated,
        reviewCount,
      },
    };
  }

  /**
   * The phone to surface as a fallback: only when the bot abstained AND a
   * non-empty phone exists. Returns undefined otherwise so the field is simply
   * absent on normal answers.
   */
  private phoneFallbackFor(
    abstained: boolean,
    phone?: string,
  ): string | undefined {
    if (!abstained) return undefined;
    const trimmed = phone?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
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
   * Abstain-rate stats over a date range: overall + per-business, each with a
   * health flag (low / ok / high) against the 5%–30% band.
   *
   * `from`/`to` are optional ISO date bounds; default is the last 7 days.
   * Returns the overall rate and a per-business breakdown sorted by volume.
   * This is the queryable "dashboard view" — no PII is read or returned.
   */
  async getAbstainStats(opts?: {
    from?: Date;
    to?: Date;
    businessId?: string;
  }): Promise<{
    range: { from: string; to: string };
    overall: {
      total: number;
      abstained: number;
      rate: number;
      flag: "low" | "ok" | "high";
    };
    perBusiness: Array<{
      businessId: string;
      total: number;
      abstained: number;
      rate: number;
      flag: "low" | "ok" | "high";
    }>;
  }> {
    const to = opts?.to ?? new Date();
    const from = opts?.from ?? new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    const match: Record<string, unknown> = {
      answeredAt: { $gte: from, $lte: to },
    };
    if (opts?.businessId && mongoose.Types.ObjectId.isValid(opts.businessId)) {
      match.business = new mongoose.Types.ObjectId(opts.businessId);
    }

    const flagFor = (rate: number, total: number): "low" | "ok" | "high" => {
      // Don't flag tiny samples — a rate off 3 requests is noise.
      if (total < 10) return "ok";
      if (rate < ABSTAIN_RATE_LOW) return "low";
      if (rate > ABSTAIN_RATE_HIGH) return "high";
      return "ok";
    };

    // Per-business counts.
    const byBusiness = await ChatAnswerEventModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      total: number;
      abstained: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: "$business",
          total: { $sum: 1 },
          abstained: { $sum: { $cond: ["$abstained", 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    let overallTotal = 0;
    let overallAbstained = 0;
    const perBusiness = byBusiness.map((b) => {
      overallTotal += b.total;
      overallAbstained += b.abstained;
      const rate = b.total > 0 ? b.abstained / b.total : 0;
      return {
        businessId: String(b._id),
        total: b.total,
        abstained: b.abstained,
        rate: Math.round(rate * 1000) / 1000,
        flag: flagFor(rate, b.total),
      };
    });

    const overallRate = overallTotal > 0 ? overallAbstained / overallTotal : 0;

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      overall: {
        total: overallTotal,
        abstained: overallAbstained,
        rate: Math.round(overallRate * 1000) / 1000,
        flag: flagFor(overallRate, overallTotal),
      },
      perBusiness,
    };
  }

  /**
   * Fetch the latest stored summary for a business — pure read, no generation.
   *
   * This is the fast runtime path for the chat API and any caller that just
   * wants whatever summary currently exists (e.g. rendering a "what customers
   * say" panel without paying for an LLM call).
   *
   * Returns null gracefully when:
   *   - the businessId is malformed, or
   *   - no summary has been generated for this business yet.
   *
   * Accepts either a string id (as controllers pass) or an ObjectId.
   */
  async getSummary(
    businessId: string | mongoose.Types.ObjectId,
  ): Promise<IReviewSummary | null> {
    const id =
      typeof businessId === "string"
        ? mongoose.Types.ObjectId.isValid(businessId)
          ? new mongoose.Types.ObjectId(businessId)
          : null
        : businessId;

    if (!id) {
      return null;
    }

    const summary = await ReviewSummaryModel.findOne({ business: id }).lean();
    return (summary as unknown as IReviewSummary) || null;
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
          overallSentiment: themes.overallSentiment,
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
    overallSentiment: OverallSentiment;
    positiveThemes: IThemeMention[];
    negativeThemes: IThemeMention[];
    factualClaims: string[];
    tokensUsed: number;
  }> {
    const empty = {
      overallSentiment: "neutral" as OverallSentiment,
      positiveThemes: [] as IThemeMention[],
      negativeThemes: [] as IThemeMention[],
      factualClaims: [] as string[],
      tokensUsed: 0,
    };

    // Compact review payload: rating + text only, dropped if no text.
    const payload = reviews
      .filter((r) => r.text && r.text.length > 10)
      .map((r) => ({
        rating: r.rating ?? null,
        text: r.text!.slice(0, 400),
      }));

    if (payload.length === 0) {
      return empty;
    }

    const systemPrompt = this.buildSummarizationPrompt();
    const userPrompt = `Reviews (JSON array):\n${JSON.stringify(payload)}`;

    let raw = "{}";
    let tokensUsed = 0;

    try {
      const completion = await llm.chatCompletion({
        model: SUMMARIZATION_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        // JSON mode: the provider constrains output to a JSON object. This is
        // the first line of defense for "valid JSON every time". The parse +
        // validate step below is the second line, for when a model ignores it.
        response_format: { type: "json_object" },
      });

      raw = completion.choices[0]?.message?.content || "{}";
      tokensUsed = completion.usage?.total_tokens || 0;
    } catch (error: any) {
      // Network / provider error — not a parsing problem. Log and degrade.
      logger.warn(
        { error: error.message },
        "Summarization LLM call failed — returning empty summary",
      );
      return empty;
    }

    // Second line of defense: parse + validate. NEVER throws — a malformed
    // model response degrades to empty themes, the job keeps running.
    const validated = this.validateAndClampThemes(raw);
    return { ...validated, tokensUsed };
  }

  /**
   * The summarization system prompt. Kept in its own method so it's easy to
   * find, version, and test. The contract here is strict on purpose:
   *   - JSON object only, exact key set
   *   - top 5 positive / top 5 negative themes
   *   - overallSentiment as a single enum value
   *   - factual claims gated to repeated, concrete facts
   *   - explicit size budget so the model self-limits before we hard-trim
   */
  private buildSummarizationPrompt(): string {
    return `You analyze customer reviews for a business and produce a compact structured summary.

Respond with ONLY a valid JSON object. No markdown, no code fences, no prose before or after. The object MUST match this exact schema and key names:

{
  "overallSentiment": "positive" | "mixed" | "negative" | "neutral",
  "positiveThemes": [
    { "theme": "<short label, ≤ ${MAX_THEME_LABEL_CHARS} chars>", "mentions": <integer>, "quotes": ["<verbatim quote, ≤ ${MAX_QUOTE_CHARS} chars>"] }
  ],
  "negativeThemes": [
    { "theme": "<short label, ≤ ${MAX_THEME_LABEL_CHARS} chars>", "mentions": <integer>, "quotes": ["<verbatim quote, ≤ ${MAX_QUOTE_CHARS} chars>"] }
  ],
  "factualClaims": ["<concrete fact repeated by multiple reviewers>"]
}

Rules:
- overallSentiment: your single best judgment of the whole review set. Use "mixed" when praise and complaints are both common; "neutral" only when reviews are sparse or genuinely lukewarm.
- positiveThemes: at most ${MAX_THEMES}, ordered most-mentioned first. Same for negativeThemes.
- Each theme has at most ${MAX_QUOTES_PER_THEME} verbatim quotes (copied exactly from the reviews, not paraphrased), each ≤ ${MAX_QUOTE_CHARS} characters.
- mentions = approximate number of reviews that touch that theme.
- factualClaims: at most ${MAX_FACTUAL_CLAIMS}. ONLY concrete, checkable facts stated by 2 or more reviewers — hours, prices, parking, amenities, policies. Examples: "Charges $25 for adult ride wristbands", "Parking is paid, not free". Skip one-off anecdotes and skip opinions.
- Never invent facts, quotes, prices, or numbers. If you are unsure, leave it out.
- Keep the whole JSON object small — well under 3 KB. Prefer fewer, higher-signal items over exhaustive lists.`;
  }

  /**
   * Parse + validate the model's JSON output into the stored shape.
   *
   * Guarantees (acceptance criteria):
   *   - NEVER throws. Broken JSON → logged + empty result, job survives.
   *   - Output conforms to the schema: known sentiment enum, ≤ 5 themes each
   *     side, ≤ 2 quotes/theme, length-capped strings, ≤ 10 factual claims.
   *   - Serialized result stays ≤ ${MAX_SUMMARY_BYTES} bytes (hard-trimmed if
   *     the model over-produced despite the prompt budget).
   */
  private validateAndClampThemes(raw: string): {
    overallSentiment: OverallSentiment;
    positiveThemes: IThemeMention[];
    negativeThemes: IThemeMention[];
    factualClaims: string[];
  } {
    const empty = {
      overallSentiment: "neutral" as OverallSentiment,
      positiveThemes: [] as IThemeMention[],
      negativeThemes: [] as IThemeMention[],
      factualClaims: [] as string[],
    };

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (error: any) {
      logger.warn(
        { error: error.message, rawPreview: raw.slice(0, 200) },
        "Summarization returned invalid JSON — using empty summary",
      );
      return empty;
    }

    if (!parsed || typeof parsed !== "object") {
      logger.warn(
        { rawPreview: raw.slice(0, 200) },
        "Summarization JSON was not an object — using empty summary",
      );
      return empty;
    }

    const validSentiments: OverallSentiment[] = [
      "positive",
      "mixed",
      "negative",
      "neutral",
    ];
    const overallSentiment: OverallSentiment = validSentiments.includes(
      parsed.overallSentiment,
    )
      ? parsed.overallSentiment
      : "neutral";

    const result = {
      overallSentiment,
      positiveThemes: this.clampThemeList(parsed.positiveThemes),
      negativeThemes: this.clampThemeList(parsed.negativeThemes),
      factualClaims: this.clampClaims(parsed.factualClaims),
    };

    // Hard size cap. If the model over-produced, trim lowest-priority content
    // (factual claims, then negative themes, then positive) until under budget.
    return this.enforceSizeBudget(result);
  }

  /** Coerce one theme array into the validated, capped shape. */
  private clampThemeList(raw: unknown): IThemeMention[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((t) => t && typeof t === "object" && typeof t.theme === "string")
      .slice(0, MAX_THEMES)
      .map((t) => ({
        theme: String(t.theme).slice(0, MAX_THEME_LABEL_CHARS),
        mentions:
          typeof t.mentions === "number" && t.mentions >= 0
            ? Math.floor(t.mentions)
            : 0,
        quotes: Array.isArray(t.quotes)
          ? t.quotes
              .filter((q: unknown) => typeof q === "string" && q.length > 0)
              .slice(0, MAX_QUOTES_PER_THEME)
              .map((q: string) => q.slice(0, MAX_QUOTE_CHARS))
          : [],
      }));
  }

  /** Coerce the factual-claims array into the validated, capped shape. */
  private clampClaims(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((c: unknown) => typeof c === "string" && c.trim().length > 0)
      .slice(0, MAX_FACTUAL_CLAIMS)
      .map((c: string) => c.slice(0, MAX_FACTUAL_CLAIM_CHARS));
  }

  /**
   * Enforce the ≤ MAX_SUMMARY_BYTES cap by trimming lowest-priority content
   * first. Positive/negative themes are the highest-value content; factual
   * claims are dropped first, then negative, then positive themes, until the
   * serialized object fits.
   */
  private enforceSizeBudget(result: {
    overallSentiment: OverallSentiment;
    positiveThemes: IThemeMention[];
    negativeThemes: IThemeMention[];
    factualClaims: string[];
  }): typeof result {
    const bytes = (obj: unknown) => Buffer.byteLength(JSON.stringify(obj), "utf8");

    if (bytes(result) <= MAX_SUMMARY_BYTES) return result;

    // 1. Drop factual claims one at a time (lowest priority for chat grounding).
    while (result.factualClaims.length > 0 && bytes(result) > MAX_SUMMARY_BYTES) {
      result.factualClaims.pop();
    }
    // 2. Drop trailing negative themes.
    while (result.negativeThemes.length > 0 && bytes(result) > MAX_SUMMARY_BYTES) {
      result.negativeThemes.pop();
    }
    // 3. Drop trailing positive themes.
    while (result.positiveThemes.length > 0 && bytes(result) > MAX_SUMMARY_BYTES) {
      result.positiveThemes.pop();
    }

    if (bytes(result) > MAX_SUMMARY_BYTES) {
      logger.warn(
        { bytes: bytes(result) },
        "Review summary still over size budget after trimming",
      );
    }
    return result;
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
      lines.push(`Overall sentiment: ${summary.overallSentiment}`);
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

    const hasPhone = !!business.phone;

    lines.push("");
    lines.push(`# Rules for your answer`);
    lines.push(
      `1. Answer ONLY from the profile and review summary above. If the answer is NOT in the profile or reviews, you MUST say so honestly — never guess, never make up prices, hours, policies, menu items, or features. It is always better to say you don't have that information than to invent an answer.`,
    );
    lines.push(
      `2. When you don't have the answer, say it plainly using a phrase like "I don't have that information" or "that isn't mentioned in the reviews."${
        hasPhone
          ? ` Then suggest the user call the business directly at ${business.phone} to ask.`
          : ``
      }`,
    );
    lines.push(
      `3. ABSTAIN (don't answer) for anything real-time or live — today's specials, current wait time, whether they're open right now, current crowd levels, today's menu, live availability. Reviews and a static profile cannot tell you what's true right now, so say you don't have current info${
        hasPhone ? ` and suggest calling to check` : ``
      }.`,
    );
    lines.push(
      `4. Distinguish facts (from profile / repeated review claims) from opinions (what some customers said).`,
    );
    lines.push(
      `5. When sharing opinions, indicate whether the sentiment is shared by many ("most visitors mention...") or just some ("a few reviewers noted...").`,
    );
    lines.push(
      `6. Be brief and direct. Answer in 1-3 sentences — ideally fewer. A simple question like "is there parking?" gets a one or two sentence answer, never a paragraph. Only go longer if the user explicitly asks for detail. Do not pad, do not list everything you know — answer exactly what was asked.`,
    );
    lines.push(
      `7. Be warm and conversational, but never invent businesses, prices, dates, or features.`,
    );
    lines.push(
      `8. If the question is unrelated to this business, politely redirect.`,
    );
    lines.push("");
    lines.push(`# Response format`);
    lines.push(
      `Respond with ONLY valid JSON matching this exact schema:`,
    );
    lines.push(
      `{ "answer": "<your reply as a string, 1-3 short sentences>", "sources": ["profile" | "reviews" | "none"] }`,
    );
    lines.push(`Source tagging rules:`);
    lines.push(
      `- Include "profile" when the answer comes from the business profile — factual things the business states about itself: hours, location, parking, phone, website, category. e.g. "Where are they located?" → ["profile"].`,
    );
    lines.push(
      `- Include "reviews" when the answer comes from customer reviews — opinions and experiences: noise level, service quality, food taste, atmosphere, value. e.g. "Is it noisy?" → ["reviews"].`,
    );
    lines.push(
      `- Include BOTH "profile" and "reviews" when the answer genuinely draws on both — e.g. "Is it a good spot for a quiet dinner?" might use hours from the profile and ambiance opinions from reviews → ["profile","reviews"]. Use two sources only when both actually contributed.`,
    );
    lines.push(
      `- Use exactly ["none"] when you didn't use either — greetings, off-topic deflections, and any time you don't know or abstain. If you say you don't have the information, the source is "none".`,
    );
    lines.push(
      `- Sources must reflect what you ACTUALLY used to construct the answer. Do not list a source just because it was provided.`,
    );

    return lines.join("\n");
  }
}

export const reviewChatService = new ReviewChatService();
