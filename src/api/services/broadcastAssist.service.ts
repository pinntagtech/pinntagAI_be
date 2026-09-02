// ─────────────────────────────────────────────────────────────────────────────
//  broadcastAssist.service.ts — "AI Assist" for the broadcast composer
//
//  The business types a broadcast title ("Closed this Saturday for a private
//  event") and taps AI Assist; this turns it into the message body.
//
//  Deliberately different from POST /ai-assist/broadcast, which is the full
//  content generator: that one needs businessId + purpose + keyMessage and
//  returns a whole content object (title, description, CTA). This endpoint has
//  one required field — the title the user already typed — so the button works
//  the moment there is a title, with no other form state filled in.
//
//  businessId is optional but worth sending: with it we pull brand voice,
//  category and audience from the business's AI training and the copy stops
//  sounding generic. Without it, the title is all the model gets.
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import { logger } from "../../utils/logger.js";
import { llm } from "../../utils/llm.js";
import { UsageTrackingService } from "./usageTracking.service.js";
import { UsageType } from "../../models/aiUsage.model.js";
import {
  containsProfanity,
  isConversationalResponse,
  isMeaningfulPhrase,
} from "../../utils/contentModeration.utils.js";
import { ContentAssistService } from "./contentAssist.service.js";

// ===========================
// Types
// ===========================

export type BroadcastPurpose =
  | "announcement"
  | "update"
  | "reminder"
  | "promotion"
  | "general";

export type BroadcastTone =
  | "professional"
  | "casual"
  | "friendly"
  | "exciting"
  | "urgent";

export type BroadcastLength = "short" | "standard";

export interface GenerateBroadcastDescriptionRequest {
  title: string;
  businessId?: string;
  purpose?: BroadcastPurpose;
  tone?: BroadcastTone;
  length?: BroadcastLength;
  keyPoints?: string[];
  callToAction?: string;
  emojiAllowed?: boolean;
  refreshSeed?: string;
}

export interface GenerateBroadcastDescriptionResponse {
  success: boolean;
  description: string;
  fallbackUsed: boolean;
  notice?: string;
  metadata: {
    generatedAt: string;
    titleUsed: string;
    purpose: BroadcastPurpose;
    tone: BroadcastTone;
    characterCount: number;
    businessName?: string;
    model: string;
  };
}

// ===========================
// Constants
// ===========================

export const VALID_BROADCAST_PURPOSES: BroadcastPurpose[] = [
  "announcement",
  "update",
  "reminder",
  "promotion",
  "general",
];

export const VALID_BROADCAST_TONES: BroadcastTone[] = [
  "professional",
  "casual",
  "friendly",
  "exciting",
  "urgent",
];

export const VALID_BROADCAST_LENGTHS: BroadcastLength[] = ["short", "standard"];

const BROADCAST_MODEL = process.env.BROADCAST_ASSIST_MODEL || "gpt-4o-mini";

const MAX_TITLE_LENGTH = 200;
const MAX_KEY_POINTS = 5;
const MAX_KEY_POINT_LENGTH = 160;
const MAX_CTA_LENGTH = 80;

// Broadcasts are read in a feed and pushed as notifications — long copy gets
// truncated by the client long before anyone finishes reading it.
const LENGTH_LIMITS: Record<BroadcastLength, { words: number; chars: number }> =
  {
    short: { words: 40, chars: 280 },
    standard: { words: 80, chars: 500 },
  };

// ===========================
// Service
// ===========================

export class BroadcastAssistService {
  /**
   * Turn a broadcast title into the message body.
   *
   * Never throws for generation problems — the composer must stay usable, so
   * failures come back as a short scaffold with `fallbackUsed: true`.
   */
  static async generateDescription(
    request: GenerateBroadcastDescriptionRequest,
  ): Promise<GenerateBroadcastDescriptionResponse> {
    const {
      businessId,
      purpose = "announcement",
      tone = "friendly",
      length = "standard",
      callToAction,
      emojiAllowed = false,
      refreshSeed,
    } = request;

    const title = request.title.trim().slice(0, MAX_TITLE_LENGTH);
    const keyPoints = (request.keyPoints || [])
      .filter((p) => typeof p === "string" && p.trim())
      .slice(0, MAX_KEY_POINTS)
      .map((p) => p.trim().slice(0, MAX_KEY_POINT_LENGTH));

    // ── Guardrail: junk or abusive titles never reach the model ─────────────
    const titleCheck = this.checkTitle(title);
    if (!titleCheck.ok) {
      logger.info(
        { title, reason: titleCheck.reason },
        "Broadcast description AI assist skipped, returning scaffold",
      );
      return this.buildFallbackResponse({
        title,
        purpose,
        tone,
        notice: titleCheck.notice,
      });
    }

    // ── Optional business context. Missing training data is not an error —
    //    it just means less specific copy. ───────────────────────────────────
    const context = await this.tryGetBusinessContext(businessId);

    try {
      const completion = await llm.chatCompletion({
        model: BROADCAST_MODEL,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(tone, length, emojiAllowed),
          },
          {
            role: "user",
            content: this.buildPrompt({
              title,
              purpose,
              keyPoints,
              callToAction,
              context,
              refreshSeed,
            }),
          },
        ],
        temperature: refreshSeed ? 0.9 : 0.7,
        max_tokens: 400,
      });

      const description = this.cleanDescription(
        completion.choices[0]?.message?.content || "",
        length,
      );

      if (!description) {
        logger.warn({ title }, "Unusable broadcast description, using scaffold");
        return this.buildFallbackResponse({
          title,
          purpose,
          tone,
          businessName: context?.businessName,
          notice:
            "Couldn't draft a message this time. Add the details below and send.",
        });
      }

      if (businessId && mongoose.Types.ObjectId.isValid(businessId)) {
        await UsageTrackingService.trackUsage({
          businessId,
          type: UsageType.CONTENT_GENERATION,
          subType: "broadcast_assist_description",
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
          model: BROADCAST_MODEL,
          success: true,
          metadata: {
            purpose,
            tone,
            length,
            titleUsed: title,
            descriptionLength: description.length,
          },
        });
      }

      logger.info(
        { businessId, purpose, tone, descriptionLength: description.length },
        "Broadcast description generated successfully",
      );

      return {
        success: true,
        description,
        fallbackUsed: false,
        metadata: {
          generatedAt: new Date().toISOString(),
          titleUsed: title,
          purpose,
          tone,
          characterCount: description.length,
          businessName: context?.businessName,
          model: BROADCAST_MODEL,
        },
      };
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId, purpose },
        "Error generating broadcast description",
      );

      return this.buildFallbackResponse({
        title,
        purpose,
        tone,
        businessName: context?.businessName,
        notice: "AI assist is unavailable right now. Write your message below.",
      });
    }
  }

  // ===========================
  // Business context
  // ===========================

  private static async tryGetBusinessContext(businessId?: string) {
    if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
      return undefined;
    }

    try {
      return await ContentAssistService.getBusinessContext(businessId);
    } catch (error: any) {
      // No AI assistant / no training data yet. Generate from the title alone
      // rather than failing the request — the button still has to work.
      logger.info(
        { businessId, error: error.message },
        "No business context for broadcast assist, generating from title only",
      );
      return undefined;
    }
  }

  // ===========================
  // Prompting
  // ===========================

  private static getSystemPrompt(
    tone: BroadcastTone,
    length: BroadcastLength,
    emojiAllowed: boolean,
  ): string {
    const limits = LENGTH_LIMITS[length];

    return `You write broadcast messages for local businesses on Pinntag. A broadcast is a short announcement pushed to customers' phones and shown in their feed — think of it as the message a shop owner would send their regulars.

Write the message BODY only. The title is already on screen above it, so never repeat the title as your first sentence.

STRICT RULES:
- ${limits.words} words maximum, ${limits.chars} characters maximum. Two to four sentences.
- Tone: ${tone}. Write like a person, not a press release.
- Use ONLY the facts given. Never invent prices, discounts, dates, times, addresses, phone numbers or menu items that were not provided.
- If a detail the reader would need is missing, leave a short bracketed placeholder such as [add the date] for the business to fill in. Do not guess it.
- No fake urgency ("hurry", "last chance") unless the input says the offer really is ending.
- No hashtags. No ALL CAPS words. ${emojiAllowed ? "At most one emoji, and only if it fits the tone." : "No emoji."}
- Plain text only — no markdown, no headings, no bullet points.
- Do not add a sign-off, a business name line, or "Sent from Pinntag".

Return ONLY the message text. No JSON, no quotes around it, no preamble like "Here's your message".`;
  }

  private static buildPrompt(params: {
    title: string;
    purpose: BroadcastPurpose;
    keyPoints: string[];
    callToAction?: string;
    context?: { businessName: string; businessCategory: string; businessDescription?: string; brandVoice?: string[]; targetAudience?: string[] };
    refreshSeed?: string;
  }): string {
    const { title, purpose, keyPoints, callToAction, context, refreshSeed } =
      params;

    const lines = [
      `BROADCAST TITLE: ${title}`,
      `PURPOSE: ${purpose}`,
      keyPoints.length
        ? `POINTS TO INCLUDE (use every one, invent nothing beyond them):\n- ${keyPoints.join("\n- ")}`
        : "",
      callToAction
        ? `CALL TO ACTION (end with this idea, in your own words): ${callToAction.slice(0, MAX_CTA_LENGTH)}`
        : "",
      context
        ? [
            "",
            "THE BUSINESS:",
            `- Name: ${context.businessName}`,
            `- Category: ${context.businessCategory}`,
            context.businessDescription
              ? `- About: ${context.businessDescription}`
              : "",
            context.brandVoice?.length
              ? `- Brand voice: ${context.brandVoice.join(", ")}`
              : "",
            context.targetAudience?.length
              ? `- Customers: ${context.targetAudience.join(", ")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n")
        : "",
      refreshSeed
        ? `\nThis is a regenerate request (seed ${refreshSeed}). Take a different angle while keeping every fact the same.`
        : "",
    ].filter(Boolean);

    return `${lines.join("\n")}\n\nWrite the broadcast message now.`;
  }

  // ===========================
  // Output cleanup
  // ===========================

  /**
   * Strip the wrappers models like to add and enforce the length ceiling.
   * Returns "" when the output isn't usable, so the caller can fall back.
   */
  private static cleanDescription(
    raw: string,
    length: BroadcastLength,
  ): string {
    let text = raw.trim();
    if (!text) return "";

    // "Here's your broadcast:" / surrounding quotes / stray markdown.
    text = text.replace(/^(here'?s?|sure|certainly)[^\n:]{0,60}:\s*/i, "");
    text = text.replace(/^```(?:\w+)?\s*|\s*```$/g, "");
    text = text.replace(/^["'“](.+)["'”]$/s, "$1");
    text = text.replace(/(^|\s)#{1,6}\s+/g, "$1"); // headings, wherever they land
    text = text.replace(/\*\*(.+?)\*\*/g, "$1");
    text = text.replace(/^(message|broadcast)\s*:\s*/i, "");
    text = text.replace(/\n{3,}/g, "\n\n").trim();

    if (text.length < 20) return "";
    if (isConversationalResponse(text)) return "";
    if (containsProfanity(text)) return "";

    const { chars } = LENGTH_LIMITS[length];
    if (text.length > chars) {
      // Trim at the last sentence end that fits, so it never stops mid-word.
      const clipped = text.slice(0, chars);
      const lastStop = Math.max(
        clipped.lastIndexOf(". "),
        clipped.lastIndexOf("! "),
        clipped.lastIndexOf("? "),
      );
      text = lastStop > chars * 0.5 ? clipped.slice(0, lastStop + 1) : clipped.trim();
    }

    return text.trim();
  }

  // ===========================
  // Guardrails & fallback
  // ===========================

  private static checkTitle(
    title: string,
  ): { ok: true } | { ok: false; reason: string; notice: string } {
    if (containsProfanity(title)) {
      return {
        ok: false,
        reason: "profanity",
        notice:
          "This title can't be used for a customer broadcast. Try rewording it.",
      };
    }

    if (!isMeaningfulPhrase(title)) {
      return {
        ok: false,
        reason: "gibberish",
        notice:
          "Give the broadcast a real title (what you're announcing) and AI Assist can write the message for you.",
      };
    }

    return { ok: true };
  }

  private static buildFallbackResponse(params: {
    title: string;
    purpose: BroadcastPurpose;
    tone: BroadcastTone;
    businessName?: string;
    notice: string;
  }): GenerateBroadcastDescriptionResponse {
    const { title, purpose, tone, businessName, notice } = params;

    const description =
      "[Add the details your customers need: what's happening, when, and what they should do next.]";

    return {
      success: true,
      description,
      fallbackUsed: true,
      notice,
      metadata: {
        generatedAt: new Date().toISOString(),
        titleUsed: title,
        purpose,
        tone,
        characterCount: description.length,
        businessName,
        model: BROADCAST_MODEL,
      },
    };
  }
}
