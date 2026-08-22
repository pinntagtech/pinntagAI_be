// ─────────────────────────────────────────────────────────────────────────────
//  bugReport.service.ts — "AI Assist" for the Report a Bug screen
//
//  The app's bug report form has a title field and a description textarea with
//  an "AI Assist" button. The user types a short title ("payment screen freezes
//  after applying a coupon") and AI expands it into a structured description
//  the user can edit before submitting.
//
//  Two things this deliberately does NOT do:
//    • Invent specifics. The model is told never to fabricate error codes,
//      timestamps, device models or steps the user did not imply — a bug report
//      full of hallucinated detail is worse than a short one.
//    • Trust the title blindly. Titles like "dsdsds" or profanity get a neutral
//      scaffold template instead of an LLM call (see isMeaningfulTitle).
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import { logger } from "../../utils/logger.js";
import { llm } from "../../utils/llm.js";
import { UsageTrackingService } from "./usageTracking.service.js";
import { UsageType } from "../../models/aiUsage.model.js";
import { containsProfanity } from "../../utils/contentModeration.utils.js";

// ===========================
// Types
// ===========================

export type BugAppType = "CONSUMER" | "BUSINESS";

export type BugCategory =
  | "crash"
  | "ui_display"
  | "performance"
  | "login_auth"
  | "payments"
  | "notifications"
  | "location_maps"
  | "offers_deals"
  | "media_upload"
  | "other";

export type BugSeverity = "low" | "medium" | "high" | "critical";

export interface BugDeviceInfo {
  platform?: string; // "ios" | "android" | free text
  osVersion?: string;
  appVersion?: string;
  deviceModel?: string;
}

export interface GenerateBugDescriptionRequest {
  title: string;
  appType?: BugAppType;
  screen?: string; // e.g. "Create Offer", "Wallet"
  category?: BugCategory; // user-picked category, if the form ever collects one
  userNotes?: string; // anything already typed in the description box
  deviceInfo?: BugDeviceInfo;
  businessId?: string; // only for usage tracking / business app reports
  userId?: string;
  refreshSeed?: string; // set on regenerate to get a different phrasing
}

export interface GenerateBugDescriptionResponse {
  success: boolean;
  description: string;
  suggestedCategory: BugCategory;
  suggestedSeverity: BugSeverity;
  fallbackUsed: boolean;
  notice?: string; // set when we fell back, so the app can nudge the user
  metadata: {
    generatedAt: string;
    appType: BugAppType;
    titleUsed: string;
    model: string;
  };
}

// ===========================
// Constants
// ===========================

export const VALID_BUG_APP_TYPES: BugAppType[] = ["CONSUMER", "BUSINESS"];

export const VALID_BUG_CATEGORIES: BugCategory[] = [
  "crash",
  "ui_display",
  "performance",
  "login_auth",
  "payments",
  "notifications",
  "location_maps",
  "offers_deals",
  "media_upload",
  "other",
];

export const VALID_BUG_SEVERITIES: BugSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

// Short, cheap task — a mini model is plenty. The LLM facade still applies its
// provider switch / fallback on top of this.
const BUG_REPORT_MODEL = process.env.BUG_REPORT_MODEL || "gpt-4o-mini";

const MAX_DESCRIPTION_LENGTH = 1200;
const MAX_TITLE_LENGTH = 200;
const MAX_USER_NOTES_LENGTH = 1000;

// ===========================
// Service
// ===========================

export class BugReportService {
  /**
   * Expand a bug title into a structured, editable bug description.
   *
   * Never throws for generation problems — an AI hiccup must not block the user
   * from filing a bug, so every failure path returns a usable scaffold with
   * `fallbackUsed: true`.
   */
  static async generateDescription(
    request: GenerateBugDescriptionRequest,
  ): Promise<GenerateBugDescriptionResponse> {
    const {
      appType = "CONSUMER",
      screen,
      category,
      deviceInfo,
      businessId,
      refreshSeed,
    } = request;

    const title = request.title.trim().slice(0, MAX_TITLE_LENGTH);
    const userNotes = request.userNotes?.trim().slice(0, MAX_USER_NOTES_LENGTH);

    // ── Guardrail: junk or abusive titles never reach the model ──────────────
    const titleCheck = this.checkTitle(title);
    if (!titleCheck.ok) {
      logger.info(
        { title, reason: titleCheck.reason },
        "Bug description AI assist skipped, returning scaffold",
      );
      return this.buildFallbackResponse({
        title,
        appType,
        category,
        deviceInfo,
        notice: titleCheck.notice,
      });
    }

    try {
      const completion = await llm.chatCompletion({
        model: BUG_REPORT_MODEL,
        messages: [
          { role: "system", content: this.getSystemPrompt(appType) },
          {
            role: "user",
            content: this.buildPrompt({
              title,
              appType,
              screen,
              category,
              userNotes,
              deviceInfo,
              refreshSeed,
            }),
          },
        ],
        temperature: refreshSeed ? 0.8 : 0.5,
        max_tokens: 700,
        response_format: { type: "json_object" },
      });

      const parsed = this.parseResponse(
        completion.choices[0]?.message?.content || "",
      );

      if (!parsed) {
        logger.warn({ title }, "Unparsable bug description response, using scaffold");
        return this.buildFallbackResponse({
          title,
          appType,
          category,
          deviceInfo,
          notice: "Couldn't draft a description this time. Here's a template to fill in.",
        });
      }

      // Only track against a real business — "system" would blow up the lookup.
      if (businessId && mongoose.Types.ObjectId.isValid(businessId)) {
        await UsageTrackingService.trackUsage({
          businessId,
          type: UsageType.CONTENT_GENERATION,
          subType: `bug_report_description_${appType.toLowerCase()}`,
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
          model: BUG_REPORT_MODEL,
          success: true,
          metadata: {
            appType,
            screen,
            titleUsed: title,
            suggestedCategory: parsed.suggestedCategory,
            suggestedSeverity: parsed.suggestedSeverity,
          },
        });
      }

      logger.info(
        {
          appType,
          screen,
          descriptionLength: parsed.description.length,
          suggestedCategory: parsed.suggestedCategory,
          suggestedSeverity: parsed.suggestedSeverity,
        },
        "Bug description generated successfully",
      );

      return {
        success: true,
        description: parsed.description,
        suggestedCategory: category || parsed.suggestedCategory,
        suggestedSeverity: parsed.suggestedSeverity,
        fallbackUsed: false,
        metadata: {
          generatedAt: new Date().toISOString(),
          appType,
          titleUsed: title,
          model: BUG_REPORT_MODEL,
        },
      };
    } catch (error: any) {
      logger.error(
        { error: error.message, appType, screen },
        "Error generating bug description",
      );

      return this.buildFallbackResponse({
        title,
        appType,
        category,
        deviceInfo,
        notice: "AI assist is unavailable right now. Here's a template to fill in.",
      });
    }
  }

  // ===========================
  // Prompting
  // ===========================

  private static getSystemPrompt(appType: BugAppType): string {
    const audience =
      appType === "BUSINESS"
        ? "a business owner using the Pinntag business app to publish offers, events and rewards"
        : "a consumer using the Pinntag app to discover local offers, events and businesses";

    return `You are a QA assistant that turns a short bug title into a clear bug report description for ${audience}.

Write in first person, as the person reporting the bug ("I tapped...", "the screen froze").

STRICT RULES:
- Use ONLY what the user gave you. Never invent error codes, timestamps, device models, account details, screen names or steps that were not stated or clearly implied by the title.
- When a detail is unknown, leave a short bracketed placeholder such as [add the exact step] instead of guessing.
- Keep it factual and neutral. No apologies, no greetings, no marketing tone, no blame.
- Plain text only. No markdown headers, bold or bullet characters other than the numbered steps.
- Under 180 words total.

Respond ONLY with a JSON object in this exact shape:
{
  "description": "What happened: ...\\n\\nSteps to reproduce:\\n1. ...\\n2. ...\\n\\nExpected result: ...\\n\\nActual result: ...",
  "category": "crash | ui_display | performance | login_auth | payments | notifications | location_maps | offers_deals | media_upload | other",
  "severity": "low | medium | high | critical"
}

Severity guide: critical = app unusable or data/money lost; high = a core flow is blocked; medium = a feature misbehaves but has a workaround; low = cosmetic or minor.`;
  }

  private static buildPrompt(params: {
    title: string;
    appType: BugAppType;
    screen?: string;
    category?: BugCategory;
    userNotes?: string;
    deviceInfo?: BugDeviceInfo;
    refreshSeed?: string;
  }): string {
    const { title, screen, category, userNotes, deviceInfo, refreshSeed } = params;

    const device = deviceInfo
      ? [
          deviceInfo.deviceModel,
          deviceInfo.platform,
          deviceInfo.osVersion && `OS ${deviceInfo.osVersion}`,
          deviceInfo.appVersion && `app ${deviceInfo.appVersion}`,
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const lines = [
      `BUG TITLE: ${title}`,
      screen ? `SCREEN / FEATURE: ${screen}` : "",
      category ? `USER-SELECTED CATEGORY: ${category}` : "",
      userNotes ? `NOTES ALREADY WRITTEN BY THE USER (keep every fact from these):\n${userNotes}` : "",
      device ? `DEVICE: ${device} — add this verbatim as a final "Device:" line.` : "",
      refreshSeed
        ? `This is a regenerate request (seed ${refreshSeed}). Reword it differently while keeping the same facts.`
        : "",
    ].filter(Boolean);

    return `${lines.join("\n")}\n\nWrite the bug description now.`;
  }

  // ===========================
  // Parsing & validation
  // ===========================

  private static parseResponse(raw: string): {
    description: string;
    suggestedCategory: BugCategory;
    suggestedSeverity: BugSeverity;
  } | null {
    if (!raw.trim()) return null;

    // response_format is json_object, but a fallback provider may still wrap the
    // JSON in prose or a code fence.
    const jsonText = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    if (!jsonText) return null;

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return null;
    }

    const description =
      typeof parsed?.description === "string" ? parsed.description.trim() : "";
    if (description.length < 20) return null;

    const category: BugCategory = VALID_BUG_CATEGORIES.includes(parsed?.category)
      ? parsed.category
      : "other";
    const severity: BugSeverity = VALID_BUG_SEVERITIES.includes(parsed?.severity)
      ? parsed.severity
      : "medium";

    return {
      description: description.slice(0, MAX_DESCRIPTION_LENGTH),
      suggestedCategory: category,
      suggestedSeverity: severity,
    };
  }

  /**
   * Reject titles the model can't do anything useful with. Cheaper than an API
   * call and stops "dsdsds" from becoming a confident, invented bug report.
   */
  private static checkTitle(
    title: string,
  ): { ok: true } | { ok: false; reason: string; notice: string } {
    if (containsProfanity(title)) {
      return {
        ok: false,
        reason: "profanity",
        notice:
          "Let's keep it clean — describe what went wrong and we'll pass it to the team.",
      };
    }

    if (!this.isMeaningfulTitle(title)) {
      return {
        ok: false,
        reason: "gibberish",
        notice:
          "Add a few more words to the title (what you tapped and what went wrong) and AI Assist can draft this for you.",
      };
    }

    return { ok: true };
  }

  private static isMeaningfulTitle(title: string): boolean {
    const cleaned = title.toLowerCase().replace(/[^a-z\s]/g, " ").trim();
    if (cleaned.replace(/\s/g, "").length < 6) return false;

    const words = cleaned.split(/\s+/).filter(Boolean);
    // Every "word" must look pronounceable — a vowel and not one letter repeated.
    const realWords = words.filter(
      (w) => /[aeiouy]/.test(w) && !/^(.)\1+$/.test(w) && !this.isRepeatedUnit(w),
    );

    return realWords.length >= 2 || realWords.join("").length >= 8;
  }

  /** "dsdsds" / "abcabcabc" — a short unit repeated to fake a word. */
  private static isRepeatedUnit(word: string): boolean {
    if (word.length < 4) return false;
    for (let unit = 1; unit <= Math.floor(word.length / 2); unit++) {
      if (word.length % unit !== 0) continue;
      const chunk = word.slice(0, unit);
      if (chunk.repeat(word.length / unit) === word) return true;
    }
    return false;
  }

  // ===========================
  // Fallback
  // ===========================

  private static buildFallbackResponse(params: {
    title: string;
    appType: BugAppType;
    category?: BugCategory;
    deviceInfo?: BugDeviceInfo;
    notice: string;
  }): GenerateBugDescriptionResponse {
    const { title, appType, category, deviceInfo, notice } = params;

    const device = deviceInfo
      ? [
          deviceInfo.deviceModel,
          deviceInfo.platform,
          deviceInfo.osVersion && `OS ${deviceInfo.osVersion}`,
          deviceInfo.appVersion && `app ${deviceInfo.appVersion}`,
        ]
          .filter(Boolean)
          .join(", ")
      : "";

    const description = [
      "What happened: [describe what you were doing when it went wrong]",
      "",
      "Steps to reproduce:",
      "1. [where you started]",
      "2. [what you tapped]",
      "3. [what happened next]",
      "",
      "Expected result: [what you expected to see]",
      "",
      "Actual result: [what you saw instead]",
      device ? `\nDevice: ${device}` : "",
    ]
      .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
      .join("\n")
      .trim();

    return {
      success: true,
      description,
      suggestedCategory: category || "other",
      suggestedSeverity: "medium",
      fallbackUsed: true,
      notice,
      metadata: {
        generatedAt: new Date().toISOString(),
        appType,
        titleUsed: title,
        model: BUG_REPORT_MODEL,
      },
    };
  }
}
