import { Request, Response } from "express";
import { logger } from "../../utils/logger.js";
import {
  ContentAssistService,
  GenerateTitlesRequest,
  GenerateDescriptionRequest,
  GenerateNotificationCopyRequest,
  ContentCreationType,
  PromotionType,
  NotificationAppType,
  NotificationTriggerType,
  NotificationTone,
} from "../services/contentAssist.service.js";
import {
  validateRequiredFields,
  withControllerError,
} from "./controller.utils.js";

// ===========================
// Validation Constants
// ===========================

const VALID_CONTENT_TYPES: ContentCreationType[] = [
  "offer",
  "flashdeal",
  "specials",
  "drop_pin",
  "event",
];

const VALID_PROMOTION_TYPES: PromotionType[] = [
  "percent_off",
  "dollar_off",
  "bogo",
  "free_item",
  "happy_hour",
  "combo_bundle",
  "custom_deal",
  "family_fun",
];

const VALID_NOTIFICATION_APP_TYPES: NotificationAppType[] = [
  "CONSUMER",
  "BUSINESS",
];

const VALID_NOTIFICATION_TRIGGER_TYPES: NotificationTriggerType[] = [
  "offer_expiring",
  "offer_viewed_not_redeemed",
  "reward_progress",
  "new_event_nearby",
  "business_inactivity",
  "business_new_review",
  "weekend_events",
  "lunch_deals",
  "weekly_summary",
];

const VALID_NOTIFICATION_TONES: NotificationTone[] = [
  "playful",
  "helpful",
  "urgent",
  "coach",
];

const MAX_TITLE_COUNT = 10;
const DEFAULT_TITLE_COUNT = 5;
const MAX_NOTIFICATION_VARIANT_COUNT = 8;
const DEFAULT_NOTIFICATION_VARIANT_COUNT = 5;

// ===========================
// Controller Functions
// ===========================

/**
 * Generate title suggestions for content
 * POST /content-assist/titles
 */
export async function generateTitles(
  req: Request,
  res: Response,
): Promise<void> {
  await withControllerError(res, "Error generating titles", async () => {
    const params: GenerateTitlesRequest = req.body;

    // Validate required fields
    if (
      !validateRequiredFields(res, params, [
        { key: "businessId" },
        { key: "contentType" },
      ])
    ) {
      return;
    }

    // Validate content type
    if (!VALID_CONTENT_TYPES.includes(params.contentType)) {
      res.status(400).json({
        success: false,
        error: `Invalid contentType. Must be one of: ${VALID_CONTENT_TYPES.join(", ")}`,
      });
      return;
    }

    // Validate promotionType if provided
    if (params.promotionType) {
      if (!VALID_PROMOTION_TYPES.includes(params.promotionType)) {
        res.status(400).json({
          success: false,
          error: `Invalid promotionType. Must be one of: ${VALID_PROMOTION_TYPES.join(", ")}`,
        });
        return;
      }
    }

    // Validate and normalize count
    const count = Math.min(
      Math.max(params.count || DEFAULT_TITLE_COUNT, 1),
      MAX_TITLE_COUNT,
    );

    logger.info(
      { businessId: params.businessId, contentType: params.contentType, count },
      "Generating content titles",
    );

    // Get business context
    const context = await ContentAssistService.getBusinessContext(
      params.businessId,
    );

    // Generate titles
    const result = await ContentAssistService.generateTitles({
      context,
      contentType: params.contentType,
      category: params.category,
      subCategory: params.subCategory,
      tags: params.tags,
      promotionType: params.promotionType,
      percentOffValue: params.percentOffValue,
      dollarOffValue: params.dollarOffValue,
      bogoOrFreeItem: params.bogoOrFreeItem,
      count,
      refreshSeed: params.refreshSeed,
      excludeTitles: params.excludeTitles,
    });

    res.status(200).json(result);
  });
}

/**
 * Refresh title suggestions (generates new titles with cache-busting)
 * POST /content-assist/titles/refresh
 */
export async function refreshTitles(
  req: Request,
  res: Response,
): Promise<void> {
  // Add a unique refresh seed to force new generation
  req.body.refreshSeed = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log("Refresh API Body:========================>", req.body);

  // Delegate to generateTitles
  return generateTitles(req, res);
}

/**
 * Generate description based on selected title
 * POST /content-assist/description
 */
export async function generateDescription(
  req: Request,
  res: Response,
): Promise<void> {
  await withControllerError(res, "Error generating description", async () => {
    const params: GenerateDescriptionRequest = req.body;

    // Validate required fields
    if (
      !validateRequiredFields(res, params, [
        { key: "businessId" },
        { key: "title" },
        { key: "contentType" },
      ])
    ) {
      return;
    }

    // Validate content type
    if (!VALID_CONTENT_TYPES.includes(params.contentType)) {
      res.status(400).json({
        success: false,
        error: `Invalid contentType. Must be one of: ${VALID_CONTENT_TYPES.join(", ")}`,
      });
      return;
    }

    // Validate promotionType if provided
    if (params.promotionType) {
      if (!VALID_PROMOTION_TYPES.includes(params.promotionType)) {
        res.status(400).json({
          success: false,
          error: `Invalid promotionType. Must be one of: ${VALID_PROMOTION_TYPES.join(", ")}`,
        });
        return;
      }
    }

    logger.info(
      {
        businessId: params.businessId,
        contentType: params.contentType,
        title: params.title,
      },
      "Generating content description",
    );

    // Get business context
    const context = await ContentAssistService.getBusinessContext(
      params.businessId,
    );

    // Generate description
    const result = await ContentAssistService.generateDescription({
      context,
      title: params.title,
      contentType: params.contentType,
      category: params.category,
      subCategory: params.subCategory,
      tags: params.tags,
      promotionType: params.promotionType,
    });

    res.status(200).json(result);
  });
}

/**
 * Generate notification copy variants
 * POST /content-assist/notification-copy
 */
export async function generateNotificationCopy(
  req: Request,
  res: Response,
): Promise<void> {
  await withControllerError(res, "Error generating notification copy", async () => {
    const params: GenerateNotificationCopyRequest = req.body;

    // Validate required fields
    if (
      !validateRequiredFields(res, params, [
        { key: "appType" },
        { key: "triggerType" },
        { key: "context" },
      ])
    ) {
      return;
    }

    // Validate appType
    if (!VALID_NOTIFICATION_APP_TYPES.includes(params.appType)) {
      res.status(400).json({
        success: false,
        error: `Invalid appType. Must be one of: ${VALID_NOTIFICATION_APP_TYPES.join(", ")}`,
      });
      return;
    }

    // Validate triggerType
    if (!VALID_NOTIFICATION_TRIGGER_TYPES.includes(params.triggerType)) {
      res.status(400).json({
        success: false,
        error: `Invalid triggerType. Must be one of: ${VALID_NOTIFICATION_TRIGGER_TYPES.join(", ")}`,
      });
      return;
    }

    // Validate tone if provided
    if (params.tone && !VALID_NOTIFICATION_TONES.includes(params.tone)) {
      res.status(400).json({
        success: false,
        error: `Invalid tone. Must be one of: ${VALID_NOTIFICATION_TONES.join(", ")}`,
      });
      return;
    }

    // Validate and normalize variantCount
    const variantCount = Math.min(
      Math.max(params.variantCount || DEFAULT_NOTIFICATION_VARIANT_COUNT, 1),
      MAX_NOTIFICATION_VARIANT_COUNT,
    );

    logger.info(
      {
        appType: params.appType,
        triggerType: params.triggerType,
        variantCount,
      },
      "Generating notification copy variants",
    );

    // Generate notification copy
    const result = await ContentAssistService.generateNotificationCopy({
      appType: params.appType,
      triggerType: params.triggerType,
      context: params.context,
      tone: params.tone,
      variantCount,
      emojiAllowed: params.emojiAllowed,
    });

    res.status(200).json(result);
  });
}
