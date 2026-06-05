import { Request, Response } from "express";
import { AIService } from "../services/ai.service.js";
import { ImageGenerationService } from "../services/imageGeneration.service.js";
import { logger } from "../../utils/logger.js";
import {
  ensureImageAccess,
  validateRequiredFields,
  withControllerError,
} from "./controller.utils.js";
import {
  SlowTimeRecommendationService,
  SlowTimeTemplate,
} from "../services/slowTimeRecommendation.service.js";
import { ContentAssistService } from "../services/contentAssist.service.js";
import { DealTemplateGeneratorService } from "../services/dealTemplateGenerator.service.js";
import { triggerNotification } from "../services/pinntagBackend.service.js";
import {
  BroadcastContentParams,
  ContentImageParams,
  ContentType,
  EventContentParams,
  ImageEditParams,
  ImageGenerationParams,
  ImproveContentParams,
  OfferContentParams,
  RewardContentParams,
} from "../../utils/types/aiAssist.types.js";
import {
  checkContentAssistAccess,
  checkImageGenerationAccess,
  getRemainingUsage,
} from "../../utils/subscription.utils.js";
import { UsageTrackingService } from "../services/usageTracking.service.js";

// ===========================
// Content Generation Endpoints
// ===========================

const VALID_CONTENT_TYPES: ContentType[] = [
  "broadcast",
  "offer",
  "reward",
  "event",
];

/**
 * Generate broadcast content
 * POST /ai-assist/broadcast
 */
export async function generateBroadcastContent(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(
    res,
    "Error generating broadcast content",
    async () => {
      const params: BroadcastContentParams = req.body;

      if (
        !validateRequiredFields(res, params, [
          { key: "businessId" },
          { key: "purpose" },
          { key: "keyMessage" },
        ])
      ) {
        return;
      }

      const content = await AIService.generateBroadcastContent(params);

      res.status(200).json({
        success: true,
        content,
      });
    }
  );
}

/**
 * Generate offer content
 * POST /ai-assist/offer
 */
export async function generateOfferContent(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error generating offer content", async () => {
    const params: OfferContentParams = req.body;

    if (
      !validateRequiredFields(res, params, [
        { key: "businessId" },
        { key: "offerType" },
      ])
    ) {
      return;
    }

    const content = await AIService.generateOfferContent(params);

    res.status(200).json({
      success: true,
      content,
    });
  });
}

/**
 * Generate reward content
 * POST /ai-assist/reward
 */
export async function generateRewardContent(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(
    res,
    "Error generating reward content",
    async () => {
      const params: RewardContentParams = req.body;

      if (
        !validateRequiredFields(res, params, [
          { key: "businessId" },
          { key: "rewardType" },
        ])
      ) {
        return;
      }

      const content = await AIService.generateRewardContent(params);

      res.status(200).json({
        success: true,
        content,
      });
    }
  );
}

/**
 * Generate event content
 * POST /ai-assist/event
 */
export async function generateEventContent(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error generating event content", async () => {
    const params: EventContentParams = req.body;

    if (
      !validateRequiredFields(res, params, [
        { key: "businessId" },
        { key: "eventType" },
      ])
    ) {
      return;
    }

    const content = await AIService.generateEventContent(params);

    res.status(200).json({
      success: true,
      content,
    });
  });
}

/**
 * Improve existing content
 * POST /ai-assist/improve
 */
export async function improveContent(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error improving content", async () => {
    const params: ImproveContentParams = req.body;

    if (
      !validateRequiredFields(res, params, [
        { key: "businessId" },
        { key: "contentType" },
        { key: "existingContent" },
        { key: "feedback" },
      ])
    ) {
      return;
    }

    const content = await AIService.improveContent(params);

    res.status(200).json({
      success: true,
      content,
    });
  });
}

/**
 * Generate content for any type (generic endpoint)
 * POST /ai-assist/generate
 */
export async function generateContent(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error generating content", async () => {
    const type = req.body.type as ContentType | undefined;
    const params = req.body.params as
      | BroadcastContentParams
      | OfferContentParams
      | RewardContentParams
      | EventContentParams
      | undefined;

    if (!validateRequiredFields(res, { type }, [{ key: "type" }])) {
      return;
    }

    if (!validateRequiredFields(res, params || {}, [{ key: "businessId" }])) {
      return;
    }

    // Ensure params is present at runtime so TypeScript can infer it's not undefined
    if (!params) {
      res.status(400).json({ error: "params are required" });
      return;
    }

    if (!VALID_CONTENT_TYPES.includes(type as ContentType)) {
      res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_CONTENT_TYPES.join(
          ", "
        )}`,
      });
      return;
    }

    const content = await AIService.generateContent(
      type as ContentType,
      params
    );

    res.status(200).json({
      success: true,
      content,
    });
  });
}

// ===========================
// Image Generation Endpoints
// ===========================

/**
 * Generate an image from a text prompt
 * POST /ai-assist/generate-image
 */
export async function generateImage(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error generating image", async () => {
    const params: ImageGenerationParams = req.body;

    if (
      !validateRequiredFields(res, params, [
        { key: "businessId" },
        { key: "prompt" },
        { key: "contentType" },
      ])
    ) {
      return;
    }

    if (!(await ensureImageAccess(res, params.businessId))) {
      return;
    }

    const image = await ImageGenerationService.generateImage(params);

    res.status(200).json({
      success: true,
      image,
    });
  });
}

/**
 * Edit an existing image
 * POST /ai-assist/edit-image
 */
export async function editImage(req: Request, res: Response): Promise<void> {
  await withControllerError(res, "Error editing image", async () => {
    const params: ImageEditParams = req.body;

    if (
      !validateRequiredFields(res, params, [
        { key: "businessId" },
        { key: "imageUrl" },
        { key: "editPrompt" },
      ])
    ) {
      return;
    }

    if (!(await ensureImageAccess(res, params.businessId))) {
      return;
    }

    const image = await ImageGenerationService.editImage(params);

    res.status(200).json({
      success: true,
      image,
    });
  });
}

/**
 * Generate a content-specific image
 * POST /ai-assist/content-image
 */
export async function generateContentImage(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error generating content image", async () => {
    const params: ContentImageParams = req.body;

    if (
      !validateRequiredFields(res, params, [
        { key: "businessId" },
        { key: "contentType" },
        { key: "title" },
      ])
    ) {
      return;
    }

    if (!(await ensureImageAccess(res, params.businessId))) {
      return;
    }

    const image = await ImageGenerationService.generateContentImage(params);

    res.status(200).json({
      success: true,
      image,
    });
  });
}

/**
 * Generate an image directly from AI-assist generated content
 * (title, description, T&C, CTA, promo code, etc.). Designed to be
 * called right after one of the /ai-assist/{broadcast,offer,reward,event}
 * endpoints so the image visually reflects the content.
 *
 * POST /ai-assist/ai-content-image
 */
export async function generateAIContentImage(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(
    res,
    "Error generating AI content image",
    async () => {
      const params: ContentImageParams = req.body;

      if (
        !validateRequiredFields(res, params, [
          { key: "businessId" },
          { key: "contentType" },
          { key: "title" },
        ])
      ) {
        return;
      }

      if (!VALID_CONTENT_TYPES.includes(params.contentType)) {
        res.status(400).json({
          error: `Invalid contentType. Must be one of: ${VALID_CONTENT_TYPES.join(
            ", "
          )}`,
        });
        return;
      }

      if (!(await ensureImageAccess(res, params.businessId))) {
        return;
      }

      const image = await ImageGenerationService.generateContentImage(params);

      res.status(200).json({
        success: true,
        image,
      });
    }
  );
}

/**
 * Generate image variations for A/B testing
 * POST /ai-assist/image-variations
 */
export async function generateImageVariations(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(
    res,
    "Error generating image variations",
    async () => {
      const { params, count = 3 } = req.body as {
        params?: ImageGenerationParams;
        count?: number;
      };

      if (
        !validateRequiredFields(res, params || {}, [
          { key: "businessId" },
          { key: "prompt" },
        ])
      ) {
        return;
      }

      if (!(await ensureImageAccess(res, params!.businessId))) {
        return;
      }

      const images = await ImageGenerationService.generateImageVariations(
        params as ImageGenerationParams,
        count
      );

      res.status(200).json({
        success: true,
        images,
        count: images.length,
      });
    }
  );
}

/**
 * Generate a text-heavy image (poster/flyer)
 * POST /ai-assist/text-image
 */
export async function generateTextImage(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error generating text image", async () => {
    const params = req.body;

    if (
      !validateRequiredFields(res, params, [
        { key: "businessId" },
        { key: "headline" },
      ])
    ) {
      return;
    }

    if (!(await ensureImageAccess(res, params.businessId))) {
      return;
    }

    const image = await ImageGenerationService.generateTextImage(params);

    res.status(200).json({
      success: true,
      image,
    });
  });
}

// ===========================
// Utility Endpoints
// ===========================

/**
 * Check subscription access for AI features
 * GET /ai-assist/access/:businessId
 */
export async function checkAccess(req: Request, res: Response): Promise<void> {
  await withControllerError(res, "Error checking access", async () => {
    const { businessId } = req.params;

    if (
      !validateRequiredFields(res, req.params as Record<string, any>, [
        { key: "businessId" },
      ])
    ) {
      return;
    }

    const [contentAccess, imageAccess, remainingImages, remainingContent] =
      await Promise.all([
        checkContentAssistAccess(businessId),
        checkImageGenerationAccess(businessId),
        getRemainingUsage(businessId, "images"),
        getRemainingUsage(businessId, "content"),
      ]);

    res.status(200).json({
      success: true,
      access: {
        contentAssist: contentAccess,
        imageGeneration: imageAccess,
      },
      usage: {
        remainingImages: remainingImages === -1 ? "unlimited" : remainingImages,
        remainingContent:
          remainingContent === -1 ? "unlimited" : remainingContent,
      },
    });
  });
}

// ===========================
// Usage Reporting Endpoints
// ===========================

/**
 * Get usage summary for a business
 * GET /ai-assist/usage/:businessId/summary
 */
export async function getUsageSummary(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error getting usage summary", async () => {
    const { businessId } = req.params;

    if (
      !validateRequiredFields(res, req.params as Record<string, any>, [
        { key: "businessId" },
      ])
    ) {
      return;
    }

    const summary = await UsageTrackingService.getUsageSummary(businessId);

    res.status(200).json({
      success: true,
      summary,
    });
  });
}

/**
 * Get detailed usage analytics for a business
 * GET /ai-assist/usage/:businessId/analytics
 */
export async function getUsageAnalytics(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error getting usage analytics", async () => {
    const { businessId } = req.params;
    const days = parseInt(req.query.days as string, 10) || 30;

    if (
      !validateRequiredFields(res, req.params as Record<string, any>, [
        { key: "businessId" },
      ])
    ) {
      return;
    }

    const analytics = await UsageTrackingService.getUsageAnalytics(
      businessId,
      days
    );

    res.status(200).json({
      success: true,
      analytics,
    });
  });
}

/**
 * Get recent usage records for a business
 * GET /ai-assist/usage/:businessId/recent
 */
export async function getRecentUsage(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(res, "Error getting recent usage", async () => {
    const { businessId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    if (
      !validateRequiredFields(res, req.params as Record<string, any>, [
        { key: "businessId" },
      ])
    ) {
      return;
    }

    const records = await UsageTrackingService.getRecentUsage(
      businessId,
      limit
    );

    res.status(200).json({
      success: true,
      records,
      count: records.length,
    });
  });
}

/**
 * Get all business usage (admin endpoint)
 * GET /ai-assist/usage/all
 */
export async function getAllBusinessUsage(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(
    res,
    "Error getting all business usage",
    async () => {
      const limit = parseInt(req.query.limit as string, 10) || 100;

      const usages = await UsageTrackingService.getAllBusinessUsage(limit);

      res.status(200).json({
        success: true,
        usages,
        count: usages.length,
      });
    }
  );
}

// ===========================
// AI Assistant Management Endpoints
// ===========================

/**
 * Update tags and generate AI description
 * POST /ai-assist/update-tags-and-description
 */
export async function updateTagsAndGenerateDescription(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(
    res,
    "Error updating tags and generating description",
    async () => {
      const { businessId, tags } = req.body;

      if (
        !validateRequiredFields(res, { businessId }, [{ key: "businessId" }])
      ) {
        return;
      }

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        res
          .status(400)
          .json({ error: "tags array is required and cannot be empty" });
        return;
      }

      // Import required models and services
      const { BusinessAIAssistantModel } = await import(
        "../../models/businessAIAssistant.model.js"
      );
      const { AIService } = await import("../services/ai.service.js");
      const mongoose = await import("mongoose");

      // Validate businessId format
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        res.status(400).json({
          error: "Invalid Business ID format. Must be a valid MongoDB ObjectId",
        });
        return;
      }

      // Find the business AI assistant
      const businessAI = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!businessAI) {
        res.status(404).json({
          error: `No AI agent found for business ID: ${businessId}`,
        });
        return;
      }

      // Update tags
      businessAI.tags = tags;
      await businessAI.save();

      logger.info(
        { businessId, tagsCount: tags.length },
        "Updated tags for business AI assistant"
      );

      // Generate description based on updated tags
      const description = await AIService.generateDescriptionForBusiness(
        businessId
      );

      logger.info({ businessId }, "Generated description for business");

      res.status(200).json({
        success: true,
        data: {
          tags,
          description,
        },
        message: "Tags updated and description generated successfully",
      });
    }
  );
}

// ===========================
// Slow-Time Manual Trigger
// ===========================

const SLOW_TIME_DISCOUNT_TYPE_MAP: Record<string, string> = {
  "% Off": "Percentage",
  "$ Off": "Flat",
  "BOGO": "BOGO",
  "Free Item": "FREE_ITEM",
  "Happy Hour": "HAPPY_HOUR",
};

function slowTimeToDealTemplate(t: SlowTimeTemplate) {
  const discountTypeKey =
    (t.discountType && SLOW_TIME_DISCOUNT_TYPE_MAP[t.discountType]) ||
    "CUSTOM";
  return {
    title: t.title,
    discountType: discountTypeKey as any,
    contentType: t.contentType,
    suggestedDiscount: t.suggestedDiscountValue ?? "",
    percentOffValue:
      t.discountType === "% Off" && t.suggestedDiscountValue
        ? Number(t.suggestedDiscountValue)
        : undefined,
    dollarOffValue:
      t.discountType === "$ Off" && t.suggestedDiscountValue
        ? Number(t.suggestedDiscountValue)
        : undefined,
    bogoOrFreeItem:
      t.discountType === "BOGO" || t.discountType === "Free Item"
        ? t.description
        : undefined,
    targetAudience: [],
    bestTiming: {
      days: t.bestTiming?.days ?? [],
      hours: t.bestTiming?.hours ?? [],
      seasonalNote: t.bestTiming?.seasonalNote,
    },
    callToAction: t.callToAction,
    marketingTips: [t.rationale],
    tags: [t.occasion, t.intensity],
    dealType: t.type,
    termsAndConditions: t.termsAndConditions,
    image: "",
  };
}

/**
 * Manually trigger a slow-time deal template + notification for a business.
 * POST /ai-assist/slow-time/trigger
 *
 * Body: {
 *   businessId: string (required),
 *   persistTemplate?: boolean,   // default false — when true, saves the template via DealTemplateGeneratorService
 *   sendNotification?: boolean,  // default true — generate notification copy variants
 *   notificationVariantCount?: number  // default 3
 * }
 */
export async function triggerSlowTimeTemplate(
  req: Request,
  res: Response
): Promise<void> {
  await withControllerError(
    res,
    "Error triggering slow-time template",
    async () => {
      const {
        businessId,
        persistTemplate = false,
        sendNotification = true,
        notificationVariantCount = 3,
        dryRun = false,
      } = req.body ?? {};

      if (
        !validateRequiredFields(
          res,
          { businessId },
          [{ key: "businessId" }]
        )
      ) {
        return;
      }

      const recommendations =
        await SlowTimeRecommendationService.getRecommendations(businessId);

      const template =
        recommendations.primaryTemplate ??
        recommendations.alternativeTemplates[0] ??
        null;

      if (!template) {
        res.status(200).json({
          success: true,
          triggered: false,
          reason: "No slow-time signal detected for this business right now",
          footprint: recommendations.footprint,
        });
        return;
      }

      let savedTemplateId: string | undefined;
      if (persistTemplate) {
        try {
          const dealTemplate = slowTimeToDealTemplate(template);
          const saved =
            await DealTemplateGeneratorService.savePreGeneratedTemplate(
              businessId,
              dealTemplate as any,
              {
                occasion: "slow_period",
                scope: "business_specific",
              }
            );
          savedTemplateId = String(saved._id);
        } catch (err: any) {
          logger.warn(
            { businessId, err: err?.message },
            "Failed to persist slow-time template — returning unsaved template"
          );
        }
      }

      let notification:
        | Awaited<
            ReturnType<typeof ContentAssistService.generateNotificationCopy>
          >
        | undefined;
      if (sendNotification) {
        try {
          notification = await ContentAssistService.generateNotificationCopy({
            appType: "BUSINESS",
            triggerType: "business_inactivity",
            tone: "coach",
            variantCount: notificationVariantCount,
            emojiAllowed: true,
            context: {
              businessId,
              offerName: template.title,
              category: template.contentType,
            },
          });
        } catch (err: any) {
          logger.warn(
            { businessId, err: err?.message },
            "Failed to generate notification copy"
          );
        }
      }

      // Manual trigger always delivers when sendNotification is true and at
      // least one variant was generated. No cooldown — that's the point of
      // the manual endpoint. `dryRun: true` skips delivery for previewing.
      let delivery: Awaited<ReturnType<typeof triggerNotification>> | undefined;
      if (
        sendNotification &&
        !dryRun &&
        notification?.variants?.length
      ) {
        const v = notification.variants[0];
        delivery = await triggerNotification({
          businessId,
          title: v.title,
          message: v.body,
        });
      }

      logger.info(
        {
          businessId,
          occasion: template.occasion,
          intensity: template.intensity,
          persisted: !!savedTemplateId,
          notificationVariants: notification?.variants?.length ?? 0,
          notificationDelivered: delivery?.delivered ?? false,
          dryRun,
        },
        "Slow-time template triggered manually"
      );

      res.status(200).json({
        success: true,
        triggered: true,
        template,
        ...(savedTemplateId ? { savedTemplateId } : {}),
        footprint: recommendations.footprint,
        alternatives: recommendations.alternativeTemplates,
        notification: notification
          ? {
              variants: notification.variants,
              fallbackUsed: notification.fallbackUsed,
              safetyFlags: notification.safetyFlags,
              delivery: delivery
                ? {
                    delivered: delivery.delivered,
                    status: delivery.status,
                    error: delivery.error,
                  }
                : { delivered: false, skipped: dryRun ? "dryRun" : "no-variants" },
            }
          : null,
      });
    }
  );
}
