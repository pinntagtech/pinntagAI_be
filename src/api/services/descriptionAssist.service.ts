// ─────────────────────────────────────────────────────────────────────────────
//  descriptionAssist.service.ts — one "AI Assist ✨" endpoint for every
//  description field in the product.
//
//  There is one button, in several places: the user has typed a title and wants
//  the body written for them. Rather than a route per screen (and a backend
//  proxy per route), this dispatches on `type` and returns one envelope.
//
//  It owns no prompts. Each type's generator keeps its own rules, guardrails and
//  fallbacks — this maps the unified request onto them and normalises what comes
//  back:
//    • bug_report → BugReportService  (QA structure, device line, triage hints)
//    • broadcast  → BroadcastAssistService (marketing copy, length ceilings)
//
//  Adding a type means: extend DescriptionAssistType, add a context interface,
//  and add one case to generate(). Callers keep the same endpoint.
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from "../../utils/logger.js";
import {
  BugReportService,
  BugAppType,
  BugCategory,
  BugDeviceInfo,
  BugSeverity,
} from "./bugReport.service.js";
import {
  BroadcastAssistService,
  BroadcastLength,
  BroadcastPurpose,
  BroadcastTone,
} from "./broadcastAssist.service.js";

// ===========================
// Types
// ===========================

export type DescriptionAssistType = "bug_report" | "broadcast";

export interface BugReportContext {
  appType?: BugAppType;
  screen?: string;
  category?: BugCategory;
  userNotes?: string;
  deviceInfo?: BugDeviceInfo;
}

export interface BroadcastContext {
  purpose?: BroadcastPurpose;
  tone?: BroadcastTone;
  length?: BroadcastLength;
  keyPoints?: string[];
  callToAction?: string;
  emojiAllowed?: boolean;
}

export type DescriptionAssistContext = BugReportContext & BroadcastContext;

export interface GenerateDescriptionRequest {
  type: DescriptionAssistType;
  title: string;
  /** Same call, new wording. This is the "Regenerate" tap. */
  regenerate?: boolean;
  context?: DescriptionAssistContext;
  businessId?: string;
  userId?: string;
}

export interface DescriptionAssistResponse {
  success: boolean;
  type: DescriptionAssistType;
  description: string;
  fallbackUsed: boolean;
  notice?: string;
  /** Present only when type is "bug_report". */
  bugReport?: {
    suggestedCategory: BugCategory;
    suggestedSeverity: BugSeverity;
  };
  /** Present only when type is "broadcast". */
  broadcast?: {
    characterCount: number;
    purpose: BroadcastPurpose;
    tone: BroadcastTone;
  };
  metadata: {
    generatedAt: string;
    titleUsed: string;
    model: string;
    businessName?: string;
  };
}

export const VALID_DESCRIPTION_ASSIST_TYPES: DescriptionAssistType[] = [
  "bug_report",
  "broadcast",
];

// ===========================
// Service
// ===========================

export class DescriptionAssistService {
  /**
   * Generate (or regenerate) a description for any supported type.
   *
   * Like the generators it delegates to, this never throws for generation
   * problems — an AI failure comes back as a usable scaffold with
   * `fallbackUsed: true`, so no form is ever blocked by it.
   */
  static async generate(
    request: GenerateDescriptionRequest,
  ): Promise<DescriptionAssistResponse> {
    const { type, title, regenerate = false, businessId, userId } = request;
    const context = request.context || {};

    // One seed for both generators: it raises temperature and tells the model
    // to take a different angle on the same facts.
    const refreshSeed = regenerate ? this.buildRefreshSeed() : undefined;

    logger.info(
      { type, regenerate, businessId, userId },
      "Generating description via AI assist",
    );

    switch (type) {
      case "bug_report":
        return this.toBugReportResponse(
          await BugReportService.generateDescription({
            title,
            appType: context.appType,
            screen: context.screen,
            category: context.category,
            userNotes: context.userNotes,
            deviceInfo: context.deviceInfo,
            businessId,
            userId,
            refreshSeed,
          }),
        );

      case "broadcast":
        return this.toBroadcastResponse(
          await BroadcastAssistService.generateDescription({
            title,
            businessId,
            purpose: context.purpose,
            tone: context.tone,
            length: context.length,
            keyPoints: context.keyPoints,
            callToAction: context.callToAction,
            emojiAllowed: context.emojiAllowed,
            refreshSeed,
          }),
        );
    }
  }

  private static buildRefreshSeed(): string {
    return `refresh_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // ===========================
  // Response mapping
  // ===========================

  private static toBugReportResponse(
    result: Awaited<ReturnType<typeof BugReportService.generateDescription>>,
  ): DescriptionAssistResponse {
    return {
      success: true,
      type: "bug_report",
      description: result.description,
      fallbackUsed: result.fallbackUsed,
      ...(result.notice && { notice: result.notice }),
      bugReport: {
        suggestedCategory: result.suggestedCategory,
        suggestedSeverity: result.suggestedSeverity,
      },
      metadata: {
        generatedAt: result.metadata.generatedAt,
        titleUsed: result.metadata.titleUsed,
        model: result.metadata.model,
      },
    };
  }

  private static toBroadcastResponse(
    result: Awaited<
      ReturnType<typeof BroadcastAssistService.generateDescription>
    >,
  ): DescriptionAssistResponse {
    return {
      success: true,
      type: "broadcast",
      description: result.description,
      fallbackUsed: result.fallbackUsed,
      ...(result.notice && { notice: result.notice }),
      broadcast: {
        characterCount: result.metadata.characterCount,
        purpose: result.metadata.purpose,
        tone: result.metadata.tone,
      },
      metadata: {
        generatedAt: result.metadata.generatedAt,
        titleUsed: result.metadata.titleUsed,
        model: result.metadata.model,
        ...(result.metadata.businessName && {
          businessName: result.metadata.businessName,
        }),
      },
    };
  }
}
