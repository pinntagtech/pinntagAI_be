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
import {
  containsProfanity,
  isMeaningfulPhrase,
} from "../../utils/contentModeration.utils.js";

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
              refreshSeed,
            }),
          },
        ],
        temperature: refreshSeed ? 0.75 : 0.4,
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

      const deviceLine = this.formatDeviceLine(deviceInfo);
      const description = deviceLine
        ? `${this.stripDeviceLine(parsed.description)}\n\n${deviceLine}`
        : this.stripDeviceLine(parsed.description);

      return {
        success: true,
        description,
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

    return `You are a QA assistant that turns a short bug title into a bug report an engineer can act on, written for ${audience}.

Write in first person, as the person reporting the bug ("I tapped...", "the screen froze").

THE HARD PART — do not pad. A title alone contains very little information, and a
long description built from a short title is worse than a short one: it buries the
few real facts in filler. Restating the same fact in four different sections is the
failure mode to avoid.

STRICT RULES:
- Never restate the title verbatim, and never say the same thing twice across sections.
- Use ONLY what the user gave you. Never invent error codes, timestamps, device models, account details, screen names or steps that were not stated or clearly implied.
- When something is unknown, write a short bracketed placeholder for the user to fill in — [add the step where it broke] — instead of inventing a plausible-sounding step. Placeholders are the point: they ask the reporter for what only they know.
- Steps to reproduce: 2 to 5 numbered imperative fragments ("Open Checkout", "Apply a coupon code"). Not sentences, no trailing full stops, no narration.
- "Expected result" and "Actual result": one short clause each, under 12 words, and they must not mirror each other word-for-word.
- Do NOT write a "Device:" line. Device details are appended automatically after you.
- Factual and neutral. No apologies, greetings, markdown, or blame.
- 120 words maximum. Shorter is better.

Respond ONLY with a JSON object in this exact shape:
{
  "description": "What happened: ...\\n\\nSteps to reproduce:\\n1. ...\\n2. ...\\n\\nExpected result: ...\\n\\nActual result: ...",
  "category": "crash | ui_display | performance | login_auth | payments | notifications | location_maps | offers_deals | media_upload | other",
  "severity": "low | medium | high | critical"
}

WORKED EXAMPLE — this is the level of detail a title-only request should produce:

Input:
BUG TITLE: App freezes when I apply a coupon at checkout
SCREEN / FEATURE: Checkout

Output:
{"description":"What happened: The app froze at checkout right after I applied a coupon. [add what you saw just before it froze]\\n\\nSteps to reproduce:\\n1. Open Checkout\\n2. Enter a coupon code and tap Apply\\n3. [add the step where it froze]\\n\\nExpected result: Discount applies and the total updates.\\n\\nActual result: Screen freezes, taps do nothing.","category":"payments","severity":"high"}

Severity guide: critical = app unusable or data/money lost; high = a core flow is blocked; medium = a feature misbehaves but has a workaround; low = cosmetic or minor.`;
  }

  private static buildPrompt(params: {
    title: string;
    appType: BugAppType;
    screen?: string;
    category?: BugCategory;
    userNotes?: string;
    refreshSeed?: string;
  }): string {
    const { title, screen, category, userNotes, refreshSeed } = params;

    // deviceInfo is deliberately NOT in this prompt. The model has no use for it
    // beyond echoing it, and echoing is exactly where it went wrong — a caller's
    // User-Agent came back as the device model. We append that line ourselves.
    const lines = [
      `BUG TITLE: ${title}`,
      screen ? `SCREEN / FEATURE: ${screen}` : "",
      category ? `USER-SELECTED CATEGORY: ${category}` : "",
      userNotes
        ? `NOTES ALREADY WRITTEN BY THE USER (keep every fact from these):\n${userNotes}`
        : "",
      refreshSeed
        ? `This is a regenerate request (seed ${refreshSeed}). Reword it differently while keeping the same facts and the same placeholders.`
        : "",
    ].filter(Boolean);

    return `${lines.join("\n")}\n\nWrite the bug description now.`;
  }

  // ===========================
  // Device line
  // ===========================

  /**
   * Values that are plainly not a device — HTTP clients, browser User-Agent
   * fragments, URLs. A caller that fills deviceModel from the User-Agent header
   * would otherwise put "PostmanRuntime/7.56.1" in the bug report.
   */
  private static readonly NOT_A_DEVICE =
    /(mozilla|applewebkit|gecko|chrome\/|safari\/|edg\/|runtime|okhttp|curl|wget|axios|node-fetch|postman|insomnia|python-requests|libwww|dart:io|java\/|go-http)/i;

  private static readonly PLATFORM_LABELS: Record<string, string> = {
    ios: "iOS",
    android: "Android",
    web: "Web",
    ipados: "iPadOS",
    macos: "macOS",
    windows: "Windows",
  };

  /** A model name a human would recognise: no version slugs, no UA strings. */
  private static cleanDeviceModel(value?: string): string | undefined {
    const text = value?.trim();
    if (!text || text.length > 40) return undefined;
    if (this.NOT_A_DEVICE.test(text)) return undefined;
    if (/[<>{}]|https?:\/\//.test(text)) return undefined;
    if (/\/\s*\d/.test(text)) return undefined; // "Something/7.56.1"
    return text;
  }

  /** A version string: has a digit, and nothing exotic. */
  private static cleanVersion(value?: string): string | undefined {
    const text = value?.trim();
    if (!text || text.length > 20) return undefined;
    if (!/\d/.test(text)) return undefined;
    if (!/^[\w.\-+ ]+$/.test(text)) return undefined;
    return text;
  }

  private static cleanPlatform(value?: string): string | undefined {
    const key = value?.trim().toLowerCase();
    if (!key) return undefined;
    return this.PLATFORM_LABELS[key];
  }

  /**
   * Build the "Device:" line ourselves, from validated parts only. Returns
   * undefined when nothing survives validation — a wrong device line is worse
   * than none, since it sends triage after the wrong platform.
   */
  private static formatDeviceLine(info?: BugDeviceInfo): string | undefined {
    if (!info) return undefined;

    const platform = this.cleanPlatform(info.platform);
    const osVersion = this.cleanVersion(info.osVersion);
    const appVersion = this.cleanVersion(info.appVersion);

    const parts = [
      this.cleanDeviceModel(info.deviceModel),
      platform && osVersion ? `${platform} ${osVersion}` : platform,
      appVersion ? `app ${appVersion}` : undefined,
    ].filter(Boolean);

    return parts.length ? `Device: ${parts.join(" · ")}` : undefined;
  }

  /** Drop any Device line the model wrote anyway, so ours is the only one. */
  private static stripDeviceLine(description: string): string {
    return description
      .split("\n")
      .filter((line) => !/^\s*device\s*:/i.test(line))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
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

    if (!isMeaningfulPhrase(title)) {
      return {
        ok: false,
        reason: "gibberish",
        notice:
          "Add a few more words to the title (what you tapped and what went wrong) and AI Assist can draft this for you.",
      };
    }

    return { ok: true };
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

    const deviceLine = this.formatDeviceLine(deviceInfo);

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
      deviceLine ? `\n${deviceLine}` : "",
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
