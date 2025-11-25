import { Router } from "express";
import {
  generateBroadcastContent,
  generateOfferContent,
  generateRewardContent,
  generateEventContent,
  improveContent,
  generateContent,
  generateImage,
  editImage,
  generateContentImage,
  generateImageVariations,
  generateTextImage,
  checkAccess,
  getUsageSummary,
  getUsageAnalytics,
  getRecentUsage,
  getAllBusinessUsage,
  updateTagsAndGenerateDescription,
} from "../controllers/aiAssistController.js";

const router = Router();

// ===========================
// Content Generation Routes
// ===========================

/**
 * @route POST /ai-assist/broadcast
 * @desc Generate broadcast content for a business
 * @body {
 *   businessId: string (required),
 *   purpose: "announcement" | "update" | "reminder" | "promotion" | "general" (required),
 *   keyMessage: string (required),
 *   urgency?: "low" | "medium" | "high",
 *   tone?: "professional" | "casual" | "friendly" | "exciting" | "urgent",
 *   targetAudience?: string,
 *   additionalContext?: string
 * }
 */
router.post("/broadcast", generateBroadcastContent);

/**
 * @route POST /ai-assist/offer
 * @desc Generate offer content for a business
 * @body {
 *   businessId: string (required),
 *   offerType: "discount" | "bogo" | "freebie" | "bundle" | "loyalty" (required),
 *   discountValue?: number,
 *   discountType?: "percentage" | "fixed" | "buy_one_get_one",
 *   product?: string,
 *   validityPeriod?: string,
 *   minPurchase?: number,
 *   tone?: string,
 *   targetAudience?: string,
 *   additionalContext?: string
 * }
 */
router.post("/offer", generateOfferContent);

/**
 * @route POST /ai-assist/reward
 * @desc Generate reward content for a business
 * @body {
 *   businessId: string (required),
 *   rewardType: "points" | "cashback" | "freeItem" | "upgrade" | "exclusive" (required),
 *   rewardValue?: string,
 *   conditions?: string,
 *   expiryDays?: number,
 *   tone?: string,
 *   targetAudience?: string,
 *   additionalContext?: string
 * }
 */
router.post("/reward", generateRewardContent);

/**
 * @route POST /ai-assist/event
 * @desc Generate event content for a business
 * @body {
 *   businessId: string (required),
 *   eventType: "workshop" | "sale" | "launch" | "celebration" | "seasonal" | "community" (required),
 *   eventName?: string,
 *   date?: string,
 *   time?: string,
 *   location?: string,
 *   capacity?: number,
 *   isFree?: boolean,
 *   cost?: number,
 *   tone?: string,
 *   targetAudience?: string,
 *   additionalContext?: string
 * }
 */
router.post("/event", generateEventContent);

/**
 * @route POST /ai-assist/improve
 * @desc Improve existing content based on feedback
 * @body {
 *   businessId: string (required),
 *   contentType: "broadcast" | "offer" | "reward" | "event" (required),
 *   existingContent: {
 *     title?: string,
 *     description?: string,
 *     callToAction?: string,
 *     terms?: string
 *   } (required),
 *   feedback: string (required),
 *   aspectToImprove?: "clarity" | "engagement" | "urgency" | "brevity" | "detail"
 * }
 */
router.post("/improve", improveContent);

/**
 * @route POST /ai-assist/generate
 * @desc Generate content for any type (generic endpoint)
 * @body {
 *   type: "broadcast" | "offer" | "reward" | "event" (required),
 *   params: ContentParams (required)
 * }
 */
router.post("/generate", generateContent);

// ===========================
// Image Generation Routes
// ===========================

/**
 * @route POST /ai-assist/generate-image
 * @desc Generate an image from a text prompt (subscription required)
 * @body {
 *   businessId: string (required),
 *   prompt: string (required),
 *   contentType: "broadcast" | "offer" | "reward" | "event" (required),
 *   style?: "photorealistic" | "illustration" | "minimal" | "vibrant" | "professional" | "artistic",
 *   aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
 *   includeText?: string,
 *   colorScheme?: string,
 *   brandElements?: string
 * }
 */
router.post("/generate-image", generateImage);

/**
 * @route POST /ai-assist/edit-image
 * @desc Edit an existing image with a text prompt (subscription required)
 * @body {
 *   businessId: string (required),
 *   imageUrl: string (required),
 *   editPrompt: string (required),
 *   preserveElements?: string[]
 * }
 */
router.post("/edit-image", editImage);

/**
 * @route POST /ai-assist/content-image
 * @desc Generate an image optimized for specific content types (subscription required)
 * @body {
 *   businessId: string (required),
 *   contentType: "broadcast" | "offer" | "reward" | "event" (required),
 *   title: string (required),
 *   description?: string,
 *   style?: ImageStyle,
 *   aspectRatio?: ImageAspectRatio,
 *   brandColors?: string[],
 *   includeLogoSpace?: boolean
 * }
 */
router.post("/content-image", generateContentImage);

/**
 * @route POST /ai-assist/image-variations
 * @desc Generate multiple image variations for A/B testing (subscription required)
 * @body {
 *   params: ImageGenerationParams (required),
 *   count?: number (default: 3, max: 4)
 * }
 */
router.post("/image-variations", generateImageVariations);

/**
 * @route POST /ai-assist/text-image
 * @desc Generate a text-heavy image (poster/flyer) (subscription required)
 * @body {
 *   businessId: string (required),
 *   headline: string (required),
 *   subheadline?: string,
 *   details?: string[],
 *   callToAction?: string,
 *   style?: ImageStyle,
 *   aspectRatio?: ImageAspectRatio,
 *   colorScheme?: string
 * }
 */
router.post("/text-image", generateTextImage);

// ===========================
// Utility Routes
// ===========================

/**
 * @route GET /ai-assist/access/:businessId
 * @desc Check subscription access for AI features
 * @returns Access status for content assist and image generation
 */
router.get("/access/:businessId", checkAccess);

// ===========================
// Usage Reporting Routes
// ===========================

/**
 * @route GET /ai-assist/usage/all
 * @desc Get usage for all businesses (admin endpoint)
 * @query limit?: number (default: 100)
 * @returns List of all business usage summaries
 */
router.get("/usage/all", getAllBusinessUsage);

/**
 * @route GET /ai-assist/usage/:businessId/summary
 * @desc Get usage summary for a business
 * @returns Current period, lifetime, today, and this month usage
 */
router.get("/usage/:businessId/summary", getUsageSummary);

/**
 * @route GET /ai-assist/usage/:businessId/analytics
 * @desc Get detailed usage analytics for a business
 * @query days?: number (default: 30)
 * @returns Daily breakdown, monthly breakdown, by type, top models
 */
router.get("/usage/:businessId/analytics", getUsageAnalytics);

/**
 * @route GET /ai-assist/usage/:businessId/recent
 * @desc Get recent usage records for a business
 * @query limit?: number (default: 50)
 * @returns List of recent usage records
 */
router.get("/usage/:businessId/recent", getRecentUsage);

// ===========================
// AI Assistant Management Routes
// ===========================

/**
 * @route POST /ai-assist/update-tags-and-description
 * @desc Update tags and generate AI description for a business AI assistant
 * @body {
 *   businessId: string (required) - MongoDB ObjectId of the business,
 *   tags: string[] (required) - Array of tags to update
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     tags: string[],
 *     description: string
 *   },
 *   message: string
 * }
 */
router.post("/update-tags-and-description", updateTagsAndGenerateDescription);

export default router;
