import { Request, Response } from "express";
import { AIService } from "../services/ai.service.js";
import { GeminiService } from "../services/gemini.service.js";
import { logger } from "../../utils/logger.js";
import {
  BroadcastContentParams,
  OfferContentParams,
  RewardContentParams,
  EventContentParams,
  ImproveContentParams,
  ImageGenerationParams,
  ImageEditParams,
  ContentImageParams,
  ContentType,
} from "../../utils/types/aiAssist.types.js";
import {
  checkImageGenerationAccess,
  checkContentAssistAccess,
  getRemainingUsage,
} from "../../utils/subscription.utils.js";
import { UsageTrackingService } from "../services/usageTracking.service.js";

// ===========================
// Content Generation Endpoints
// ===========================

/**
 * Generate broadcast content
 * POST /ai-assist/broadcast
 */
export async function generateBroadcastContent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const params: BroadcastContentParams = req.body;

    if (!params.businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!params.purpose) {
      res.status(400).json({ error: "purpose is required" });
      return;
    }

    if (!params.keyMessage) {
      res.status(400).json({ error: "keyMessage is required" });
      return;
    }

    const content = await AIService.generateBroadcastContent(params);

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error generating broadcast content");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate offer content
 * POST /ai-assist/offer
 */
export async function generateOfferContent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const params: OfferContentParams = req.body;

    if (!params.businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!params.offerType) {
      res.status(400).json({ error: "offerType is required" });
      return;
    }

    const content = await AIService.generateOfferContent(params);

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error generating offer content");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate reward content
 * POST /ai-assist/reward
 */
export async function generateRewardContent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const params: RewardContentParams = req.body;

    if (!params.businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!params.rewardType) {
      res.status(400).json({ error: "rewardType is required" });
      return;
    }

    const content = await AIService.generateRewardContent(params);

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error generating reward content");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate event content
 * POST /ai-assist/event
 */
export async function generateEventContent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const params: EventContentParams = req.body;

    if (!params.businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!params.eventType) {
      res.status(400).json({ error: "eventType is required" });
      return;
    }

    const content = await AIService.generateEventContent(params);

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error generating event content");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Improve existing content
 * POST /ai-assist/improve
 */
export async function improveContent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const params: ImproveContentParams = req.body;

    if (!params.businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!params.contentType) {
      res.status(400).json({ error: "contentType is required" });
      return;
    }

    if (!params.existingContent) {
      res.status(400).json({ error: "existingContent is required" });
      return;
    }

    if (!params.feedback) {
      res.status(400).json({ error: "feedback is required" });
      return;
    }

    const content = await AIService.improveContent(params);

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error improving content");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate content for any type (generic endpoint)
 * POST /ai-assist/generate
 */
export async function generateContent(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { type, params } = req.body;

    if (!type) {
      res.status(400).json({ error: "type is required" });
      return;
    }

    if (!params || !params.businessId) {
      res.status(400).json({ error: "params with businessId is required" });
      return;
    }

    const validTypes: ContentType[] = ["broadcast", "offer", "reward", "event"];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
      });
      return;
    }

    const content = await AIService.generateContent(type, params);

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error generating content");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
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
  try {
    const params: ImageGenerationParams = req.body;

    if (!params.businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!params.prompt) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    if (!params.contentType) {
      res.status(400).json({ error: "contentType is required" });
      return;
    }

    // Check subscription before processing
    const access = await checkImageGenerationAccess(params.businessId);
    if (!access.hasAccess) {
      res.status(403).json({
        success: false,
        error: access.reason,
        subscriptionRequired: true,
        currentPlan: access.currentPlan,
        requiredPlan: access.requiredPlan,
        upgradeUrl: access.upgradeUrl,
      });
      return;
    }

    const image = await GeminiService.generateImage(params);

    res.status(200).json({
      success: true,
      image,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error generating image");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Edit an existing image
 * POST /ai-assist/edit-image
 */
export async function editImage(req: Request, res: Response): Promise<void> {
  try {
    const params: ImageEditParams = req.body;

    if (!params.businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!params.imageUrl) {
      res.status(400).json({ error: "imageUrl is required" });
      return;
    }

    if (!params.editPrompt) {
      res.status(400).json({ error: "editPrompt is required" });
      return;
    }

    // Check subscription before processing
    const access = await checkImageGenerationAccess(params.businessId);
    if (!access.hasAccess) {
      res.status(403).json({
        success: false,
        error: access.reason,
        subscriptionRequired: true,
        currentPlan: access.currentPlan,
        requiredPlan: access.requiredPlan,
        upgradeUrl: access.upgradeUrl,
      });
      return;
    }

    const image = await GeminiService.editImage(params);

    res.status(200).json({
      success: true,
      image,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error editing image");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate a content-specific image
 * POST /ai-assist/content-image
 */
export async function generateContentImage(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const params: ContentImageParams = req.body;

    if (!params.businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!params.contentType) {
      res.status(400).json({ error: "contentType is required" });
      return;
    }

    if (!params.title) {
      res.status(400).json({ error: "title is required" });
      return;
    }

    // Check subscription before processing
    const access = await checkImageGenerationAccess(params.businessId);
    if (!access.hasAccess) {
      res.status(403).json({
        success: false,
        error: access.reason,
        subscriptionRequired: true,
        currentPlan: access.currentPlan,
        requiredPlan: access.requiredPlan,
        upgradeUrl: access.upgradeUrl,
      });
      return;
    }

    const image = await GeminiService.generateContentImage(params);

    res.status(200).json({
      success: true,
      image,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error generating content image");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate image variations for A/B testing
 * POST /ai-assist/image-variations
 */
export async function generateImageVariations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { params, count = 3 } = req.body;

    if (!params || !params.businessId) {
      res.status(400).json({ error: "params with businessId is required" });
      return;
    }

    if (!params.prompt) {
      res.status(400).json({ error: "params.prompt is required" });
      return;
    }

    // Check subscription before processing
    const access = await checkImageGenerationAccess(params.businessId);
    if (!access.hasAccess) {
      res.status(403).json({
        success: false,
        error: access.reason,
        subscriptionRequired: true,
        currentPlan: access.currentPlan,
        requiredPlan: access.requiredPlan,
        upgradeUrl: access.upgradeUrl,
      });
      return;
    }

    const images = await GeminiService.generateImageVariations(params, count);

    res.status(200).json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error generating image variations");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Generate a text-heavy image (poster/flyer)
 * POST /ai-assist/text-image
 */
export async function generateTextImage(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const params = req.body;

    if (!params.businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!params.headline) {
      res.status(400).json({ error: "headline is required" });
      return;
    }

    // Check subscription before processing
    const access = await checkImageGenerationAccess(params.businessId);
    if (!access.hasAccess) {
      res.status(403).json({
        success: false,
        error: access.reason,
        subscriptionRequired: true,
        currentPlan: access.currentPlan,
        requiredPlan: access.requiredPlan,
        upgradeUrl: access.upgradeUrl,
      });
      return;
    }

    const image = await GeminiService.generateTextImage(params);

    res.status(200).json({
      success: true,
      image,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error generating text image");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// ===========================
// Utility Endpoints
// ===========================

/**
 * Check subscription access for AI features
 * GET /ai-assist/access/:businessId
 */
export async function checkAccess(req: Request, res: Response): Promise<void> {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      res.status(400).json({ error: "businessId is required" });
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
  } catch (error: any) {
    logger.error({ error: error.message }, "Error checking access");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
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
  try {
    const { businessId } = req.params;

    if (!businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    const summary = await UsageTrackingService.getUsageSummary(businessId);

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error getting usage summary");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get detailed usage analytics for a business
 * GET /ai-assist/usage/:businessId/analytics
 */
export async function getUsageAnalytics(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { businessId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    if (!businessId) {
      res.status(400).json({ error: "businessId is required" });
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
  } catch (error: any) {
    logger.error({ error: error.message }, "Error getting usage analytics");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get recent usage records for a business
 * GET /ai-assist/usage/:businessId/recent
 */
export async function getRecentUsage(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { businessId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    const records = await UsageTrackingService.getRecentUsage(businessId, limit);

    res.status(200).json({
      success: true,
      records,
      count: records.length,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error getting recent usage");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get all business usage (admin endpoint)
 * GET /ai-assist/usage/all
 */
export async function getAllBusinessUsage(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 100;

    const usages = await UsageTrackingService.getAllBusinessUsage(limit);

    res.status(200).json({
      success: true,
      usages,
      count: usages.length,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error getting all business usage");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
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
  try {
    const { businessId, tags } = req.body;

    if (!businessId) {
      res.status(400).json({ error: "businessId is required" });
      return;
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      res.status(400).json({ error: "tags array is required and cannot be empty" });
      return;
    }

    // Import required models and services
    const { BusinessAIAssistantModel } = await import("../../models/businessAIAssistant.model.js");
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
    const description = await AIService.generateDescriptionForBusiness(businessId);

    logger.info({ businessId }, "Generated description for business");

    res.status(200).json({
      success: true,
      data: {
        tags,
        description,
      },
      message: "Tags updated and description generated successfully",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error updating tags and generating description");
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
