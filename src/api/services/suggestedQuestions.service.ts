// ─────────────────────────────────────────────────────────────────────────────
//  suggestedQuestions.service.ts
//
//  Generates the "conversation starter" chips shown on the review-chat entry
//  screen for a specific business. Uses the same grounding data as the chat
//  itself — business profile, review summary, website extract — so the chips
//  are relevant to the actual business (a museum gets museum chips, a
//  restaurant gets restaurant chips) instead of hardcoded generic prompts.
//
//  Trigger: LAZY on first request. Cached in Mongo for 30 days.
//
//  Fail-open: on any error we return whatever's cached; if nothing is
//  cached we return an empty array. The frontend already has local static
//  chips as its ultimate fallback, so an empty response is safe.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import { llm } from "../../utils/llm.js";
import { logger } from "../../utils/logger.js";
import { getBackendConnection } from "../../db/connection.js";
import { getBackendBusinessModel } from "../../models/pinntagBackend/business.model.js";
import { ReviewSummaryModel } from "../../models/reviewSummary.model.js";
import { WebsiteSummaryModel } from "../../models/websiteSummary.model.js";
import {
  SuggestedQuestionsModel,
  ISuggestedQuestions,
  ISuggestedQuestionsGrounding,
} from "../../models/suggestedQuestions.model.js";

const MODEL = "gpt-4o-mini";

// TTL — chip surface is stable, and the LLM call isn't free. 30 days keeps us
// cheap; ops can force refresh via the regenerate endpoint.
const SUGGESTIONS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const TARGET_COUNT = 5;
const MAX_COUNT = 8; // hard cap in case the model over-produces
const MAX_LABEL_CHARS = 40;
const MIN_LABEL_CHARS = 2;

class SuggestedQuestionsService {
  /** Pure read — never triggers generation. Null if none exists. */
  async getSuggestions(
    businessId: string | mongoose.Types.ObjectId,
  ): Promise<ISuggestedQuestions | null> {
    const id = this.toObjectId(businessId);
    if (!id) return null;
    const doc = await SuggestedQuestionsModel.findOne({ business: id }).lean();
    return (doc as unknown as ISuggestedQuestions) || null;
  }

  /**
   * Runtime entry: return fresh cached chips, or generate + cache if stale.
   * Never throws — on any failure returns the stale cached doc if we have
   * one, else null.
   */
  async getOrGenerateSuggestions(
    businessId: string | mongoose.Types.ObjectId,
  ): Promise<ISuggestedQuestions | null> {
    const id = this.toObjectId(businessId);
    if (!id) return null;

    try {
      const existing = await SuggestedQuestionsModel.findOne({
        business: id,
      }).lean();

      if (existing) {
        const age = Date.now() - new Date(existing.generatedAt).getTime();
        if (age < SUGGESTIONS_TTL_MS) {
          return existing as unknown as ISuggestedQuestions;
        }
      }

      const fresh = await this.generateSuggestions(id);
      return fresh ?? (existing as unknown as ISuggestedQuestions) ?? null;
    } catch (err: any) {
      logger.warn(
        { error: err.message, businessId: String(id) },
        "getOrGenerateSuggestions failed",
      );
      return null;
    }
  }

  /**
   * Force-regenerate. Used by an ops endpoint; also called by
   * getOrGenerateSuggestions when the cached entry is stale.
   *
   * Returns null on total failure (which is fine — caller falls back to
   * whatever was cached or an empty list).
   */
  async generateSuggestions(
    businessId: mongoose.Types.ObjectId,
  ): Promise<ISuggestedQuestions | null> {
    const conn = await getBackendConnection();
    const BusinessModel = getBackendBusinessModel(conn);

    const [business, reviewSummary, websiteSummary] = await Promise.all([
      BusinessModel.findById(businessId).lean(),
      ReviewSummaryModel.findOne({ business: businessId }).lean(),
      WebsiteSummaryModel.findOne({ business: businessId }).lean(),
    ]);

    if (!business) {
      logger.warn(
        { businessId: String(businessId) },
        "generateSuggestions: business not found",
      );
      return null;
    }

    const grounding: ISuggestedQuestionsGrounding = {
      hasProfileOperationalFields: this.hasOperationalFields(business),
      hasReviewSummary:
        !!reviewSummary && (reviewSummary as any).totalReviews > 0,
      hasWebsiteSummary:
        !!websiteSummary && (websiteSummary as any).status === "ok",
    };

    const context = this.buildContext(business, reviewSummary, websiteSummary);

    let suggestions: string[] = [];
    let tokensUsed = 0;

    try {
      const completion = await llm.chatCompletion({
        model: MODEL,
        messages: [
          { role: "system", content: this.buildPrompt() },
          { role: "user", content: context },
        ],
        temperature: 0.4,
        max_tokens: 250,
        response_format: { type: "json_object" },
      });
      const raw = completion.choices[0]?.message?.content || "{}";
      tokensUsed = completion.usage?.total_tokens || 0;
      suggestions = this.parseAndClamp(raw);
    } catch (err: any) {
      logger.warn(
        { error: err.message, businessId: String(businessId) },
        "Suggested-questions LLM call failed",
      );
      return null;
    }

    if (suggestions.length === 0) {
      logger.info(
        { businessId: String(businessId) },
        "Suggested-questions generation produced no usable chips",
      );
      return null;
    }

    const doc = await SuggestedQuestionsModel.findOneAndUpdate(
      { business: businessId },
      {
        $set: {
          business: businessId,
          suggestions,
          generatedAt: new Date(),
          modelUsed: MODEL,
          tokensUsed,
          grounding,
        },
      },
      { upsert: true, new: true },
    ).lean();

    logger.info(
      {
        businessId: String(businessId),
        count: suggestions.length,
        tokensUsed,
        grounding,
      },
      "Suggested questions generated",
    );

    return doc as unknown as ISuggestedQuestions;
  }

  // ── Context assembly ─────────────────────────────────────────────────────

  /**
   * Compact grounding context for the LLM. Deliberately short — the model
   * needs *what this business is* + *what it's known for*, not the whole
   * chat prompt. We do NOT reuse the chat system prompt because that one
   * is answering questions; this one is generating them.
   */
  private buildContext(
    business: any,
    reviewSummary: any,
    websiteSummary: any,
  ): string {
    const parts: string[] = [];
    parts.push(`Business name: ${business.name || "(unknown)"}`);
    if (business.category) parts.push(`Category: ${business.category}`);
    if (Array.isArray(business.tags) && business.tags.length > 0) {
      parts.push(`Tags: ${business.tags.slice(0, 8).join(", ")}`);
    }
    const description = business.description || business.bio;
    if (typeof description === "string" && description.trim().length > 0) {
      parts.push(`Description: ${description.slice(0, 300)}`);
    }
    if (business.city || business.state) {
      parts.push(
        `Location: ${[business.city, business.state].filter(Boolean).join(", ")}`,
      );
    }

    // Operational signals — these tell the model what kinds of questions
    // actually have answers (so we prefer generating chips we CAN answer).
    const opFacts: string[] = [];
    if (typeof business.isParkingAvailable === "boolean") {
      opFacts.push(`parking:${business.isParkingAvailable ? "yes" : "no"}`);
    }
    if (typeof business.isWheelchairAccessible === "boolean") {
      opFacts.push(
        `wheelchair:${business.isWheelchairAccessible ? "yes" : "no"}`,
      );
    }
    if (typeof business.acceptsReservations === "boolean") {
      opFacts.push(
        `reservations:${business.acceptsReservations ? "yes" : "no"}`,
      );
    }
    if (Array.isArray(business.menus) && business.menus.length > 0) {
      opFacts.push("menus:published");
    }
    if (business.regularTiming || business.openingTime) {
      opFacts.push("hours:known");
    }
    if (
      Array.isArray(business.paymentMethods) &&
      business.paymentMethods.length > 0
    ) {
      opFacts.push("payments:known");
    }
    if (opFacts.length > 0) {
      parts.push(`Operational data available: ${opFacts.join(", ")}`);
    }

    if (reviewSummary) {
      const rs = reviewSummary;
      parts.push(
        `Reviews: ${rs.totalReviews || 0} reviews, ${rs.averageRating || 0}/5 avg, sentiment ${rs.overallSentiment || "unknown"}`,
      );
      const positive = (rs.positiveThemes || [])
        .slice(0, 4)
        .map((t: any) => t.theme)
        .filter(Boolean);
      if (positive.length > 0) {
        parts.push(`Common praise: ${positive.join(", ")}`);
      }
      const negative = (rs.negativeThemes || [])
        .slice(0, 3)
        .map((t: any) => t.theme)
        .filter(Boolean);
      if (negative.length > 0) {
        parts.push(`Common complaints: ${negative.join(", ")}`);
      }
    }

    if (websiteSummary && websiteSummary.status === "ok") {
      const w = websiteSummary;
      if (w.aboutSummary) {
        parts.push(`About (from website): ${w.aboutSummary.slice(0, 300)}`);
      }
      const services: string[] = Array.isArray(w.services) ? w.services : [];
      if (services.length > 0) {
        parts.push(`Services listed: ${services.slice(0, 6).join(", ")}`);
      }
      const faqQuestions: string[] = Array.isArray(w.faqs)
        ? w.faqs.map((f: any) => f?.q).filter((q: unknown) => typeof q === "string")
        : [];
      if (faqQuestions.length > 0) {
        parts.push(`Website FAQ topics: ${faqQuestions.slice(0, 5).join(" | ")}`);
      }
    }

    return parts.join("\n");
  }

  private hasOperationalFields(business: any): boolean {
    return !!(
      business.regularTiming ||
      business.openingTime ||
      typeof business.isParkingAvailable === "boolean" ||
      typeof business.isWheelchairAccessible === "boolean" ||
      typeof business.acceptsReservations === "boolean" ||
      (Array.isArray(business.menus) && business.menus.length > 0) ||
      (Array.isArray(business.paymentMethods) &&
        business.paymentMethods.length > 0)
    );
  }

  // ── Prompt + parse ───────────────────────────────────────────────────────

  private buildPrompt(): string {
    return `You generate short "conversation starter" chip labels for an AI chatbot about a specific business. Users tap these chips on the chat entry screen to send them as questions.

Given the business context below, produce EXACTLY ${TARGET_COUNT} chip labels that a real customer would plausibly want to ask this specific business — not generic prompts.

Rules:
- Each chip is 2-4 words. Terse, like a search-suggestion pill. Examples of good chip shape: "Ticket prices", "Guided tours", "Parking", "Wheelchair access", "Popular exhibits", "Reservations", "Best time to visit". Bad shape: "What are the ticket prices?" (too long), "Info" (too vague).
- Chips must be RELEVANT to this business's category and known features. A museum chatbot should NOT surface "Reservations" or "Food options" unless the museum actually has a restaurant or requires reservations. A restaurant chatbot should NOT surface "Guided tours" unless it explicitly offers them.
- Prefer topics the chatbot can plausibly answer given the context (hours, parking, accessibility, popular items/exhibits, common praise/complaints, services listed on the website). Do NOT surface real-time questions like "current wait time" or "today's specials" — the bot must abstain on those.
- Avoid duplicates and near-duplicates ("Hours" and "Opening hours" — pick one).
- Do not include emojis. Capitalize like a chip label (e.g. "Ticket prices", not "TICKET PRICES" or "ticket prices").
- No punctuation at the end. "?" is optional on chips that read as short questions ("Food options?"), otherwise leave it off.

Respond with ONLY a JSON object matching this exact schema:
{ "suggestions": ["<chip 1>", "<chip 2>", "<chip 3>", "<chip 4>", "<chip 5>"] }

No prose, no markdown, no code fences.`;
  }

  /**
   * Parse the LLM output and clamp to schema. Never throws — malformed
   * output degrades to an empty array and the caller records "no chips".
   */
  private parseAndClamp(raw: string): string[] {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
    if (!parsed || typeof parsed !== "object") return [];
    const arr = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of arr) {
      if (typeof raw !== "string") continue;
      const cleaned = this.cleanLabel(raw);
      if (!cleaned) continue;
      const key = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(cleaned);
      if (out.length >= MAX_COUNT) break;
    }
    return out;
  }

  private cleanLabel(raw: string): string | null {
    // Strip surrounding whitespace, trailing sentence-ending punctuation, and
    // any wrapping quotes the model may have added.
    let s = raw.trim();
    if (!s) return null;
    s = s.replace(/^["'`]+|["'`]+$/g, "").trim();
    s = s.replace(/[.。]+$/, "").trim();
    if (s.length < MIN_LABEL_CHARS) return null;
    if (s.length > MAX_LABEL_CHARS) s = s.slice(0, MAX_LABEL_CHARS).trim();
    return s;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private toObjectId(
    id: string | mongoose.Types.ObjectId,
  ): mongoose.Types.ObjectId | null {
    if (typeof id !== "string") return id;
    return mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : null;
  }
}

export const suggestedQuestionsService = new SuggestedQuestionsService();
