import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import { generateDescription } from "../controllers/descriptionAssistController.js";
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
  generateAIContentImage,
  generateImageVariations,
  generateTextImage,
  checkAccess,
  getUsageSummary,
  getUsageAnalytics,
  getRecentUsage,
  getAllBusinessUsage,
  updateTagsAndGenerateDescription,
  triggerSlowTimeTemplate,
} from "../controllers/aiAssistController.js";

const router = Router();

// ===========================
// Unified Description Assist
// ===========================

/**
 * @route POST /ai-assist/description
 * @desc The single "AI Assist ✨" endpoint: the user has typed a title, this
 *       writes the description body. Handles both the first tap and every
 *       "Regenerate" tap after it. Replaces /bug-report/description,
 *       /broadcast-assist/description and their /refresh variants.
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 *
 * @body {
 *   type: "bug_report" | "broadcast" (required) - which field is being written,
 *   title: string (required, min 3 chars) - the title the user typed,
 *   regenerate?: boolean (default false) - true on a "Regenerate" tap: same
 *                facts, new wording,
 *   businessId?: string - bug_report: AI usage tracking.
 *                         broadcast: pulls brand voice/category/audience so the
 *                         copy isn't generic. Ignored if the business has no
 *                         assistant yet — generation continues from the title.
 *   userId?: string - log correlation only,
 *
 *   context?: {
 *     // type: "bug_report"
 *     appType?: "CONSUMER" | "BUSINESS" (default "CONSUMER"),
 *     screen?: string - where the bug happened, e.g. "Checkout",
 *     category?: "crash" | "ui_display" | "performance" | "login_auth" |
 *                "payments" | "notifications" | "location_maps" |
 *                "offers_deals" | "media_upload" | "other",
 *     userNotes?: string - text already in the box; every fact in it is kept,
 *     deviceInfo?: { platform?, osVersion?, appVersion?, deviceModel? }
 *                  - validated, then appended as a "Device:" line. Never fill
 *                    deviceModel from the User-Agent header,
 *
 *     // type: "broadcast"
 *     purpose?: "announcement" | "update" | "reminder" | "promotion" | "general",
 *     tone?: "professional" | "casual" | "friendly" | "exciting" | "urgent",
 *     length?: "short" | "standard" - 40 words/280 chars vs 80 words/500 chars,
 *     keyPoints?: string[] - facts to include (max 5); nothing beyond them is invented,
 *     callToAction?: string - what the reader should do next,
 *     emojiAllowed?: boolean (default false)
 *   }
 * }
 *
 * @response {
 *   success: boolean,
 *   type: "bug_report" | "broadcast",
 *   description: string,
 *   fallbackUsed: boolean,
 *   notice?: string,        // present when fallbackUsed — show as a hint
 *   bugReport?: { suggestedCategory: string, suggestedSeverity: "low" | "medium" | "high" | "critical" },
 *   broadcast?: { characterCount: number, purpose: string, tone: string },
 *   metadata: { generatedAt: string, titleUsed: string, model: string, businessName?: string }
 * }
 *
 * @example Bug report:
 * {
 *   "type": "bug_report",
 *   "title": "App freezes when I apply a coupon at checkout",
 *   "context": {
 *     "screen": "Checkout",
 *     "deviceInfo": { "platform": "ios", "osVersion": "17.2", "appVersion": "2.3.1" }
 *   }
 * }
 *
 * @example Broadcast, regenerating:
 * {
 *   "type": "broadcast",
 *   "title": "Closed this Saturday for a private event",
 *   "regenerate": true,
 *   "businessId": "507f1f77bcf86cd799439011",
 *   "context": { "purpose": "announcement", "tone": "friendly" }
 * }
 *
 * Notes:
 * - Never 500s on an AI failure. Unusable titles (gibberish, profanity) and model
 *   errors return 200 with a fill-in-the-blanks scaffold, fallbackUsed: true and
 *   a `notice`. Branch on `fallbackUsed`, not on `success`.
 * - Missing specifics come back as bracketed placeholders like [add the date],
 *   never as invented dates, prices or steps.
 */
router.post("/description", internalApiKeyGuard, generateDescription);

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
 *   additionalContext?: string,
 *   dayPart?: "BREAKFAST" | "BRUNCH" | "LUNCH" | "DINNER" | "LATE_NIGHT" (food & drinks businesses only — anchors title to meal occasion)
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
 *   additionalContext?: string,
 *   dayPart?: "BREAKFAST" | "BRUNCH" | "LUNCH" | "DINNER" | "LATE_NIGHT" (food & drinks businesses only — anchors title to meal occasion)
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
 *   additionalContext?: string,
 *   dayPart?: "BREAKFAST" | "BRUNCH" | "LUNCH" | "DINNER" | "LATE_NIGHT" (food & drinks businesses only — anchors title to meal occasion)
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
 *   additionalContext?: string,
 *   dayPart?: "BREAKFAST" | "BRUNCH" | "LUNCH" | "DINNER" | "LATE_NIGHT" (food & drinks businesses only — anchors title to meal occasion)
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
 * @route POST /ai-assist/ai-content-image
 * @desc Generate an image directly from AI-assist generated content. Pair
 *       this with /ai-assist/{broadcast,offer,reward,event} — pass the
 *       returned title, description, termsAndConditions, callToAction,
 *       promoCode, hashtags, etc. straight through, and you'll get a
 *       matching image. Subscription required.
 * @body {
 *   businessId: string (required),
 *   contentType: "broadcast" | "offer" | "reward" | "event" (required),
 *   title: string (required),
 *   description?: string,
 *   termsAndConditions?: string,
 *   validityPeriod?: string,
 *   callToAction?: string,
 *   promoCode?: string,
 *   hashtags?: string[],
 *   category?: string,
 *   subcategory?: string,
 *   tags?: string[],
 *   dealType?: string,
 *   discountValue?: number,
 *   discountType?: "percentage" | "fixed" | "buy_one_get_one",
 *   eventType?: string,
 *   targetAudience?: string,
 *   tone?: string,
 *   style?: ImageStyle,
 *   aspectRatio?: ImageAspectRatio,
 *   brandColors?: string[],
 *   includeLogoSpace?: boolean
 * }
 */
router.post("/ai-content-image", generateAIContentImage);

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

// ===========================
// Slow-Time Manual Trigger
// ===========================

/**
 * @route POST /ai-assist/slow-time/trigger
 * @desc Manually trigger a slow-time deal template + notification copy for a business.
 *       Selects the best template based on the business's user-footprint signals
 *       (views, likes, RSVPs, follows, nearby visitors) and optionally persists
 *       the template and/or returns notification copy variants for the backend
 *       to deliver.
 *
 *       Gated on Business.dailyRecommendationEnabled (pinntagBackend) — the
 *       business owner's own switch. When it is off the endpoint returns
 *       200 with triggered=false and recommendationsEnabled=false, and does
 *       no template, image or notification work.
 *
 *       Billing: persisting a template is a recommendation update and costs
 *       DAILY_RECOMMENDATION_CREDIT_COST (5) credits; returns 402 when the
 *       wallet cannot cover it. Previews (persistTemplate=false or
 *       dryRun=true) are free.
 * @body {
 *   businessId: string (required),
 *   persistTemplate?: boolean (default: false),
 *   sendNotification?: boolean (default: true),
 *   notificationVariantCount?: number (default: 3),
 *   includeImage?: boolean (default: true)  // generate/reuse AI artwork
 * }
 * @returns {
 *   success: boolean,
 *   triggered: boolean,
 *   recommendationsEnabled: boolean,
 *   reason?: string,
 *   template?: SlowTimeTemplate,
 *   imageUrl?: string,
 *   savedTemplateId?: string,
 *   footprint: FootprintSnapshot,
 *   alternatives: SlowTimeTemplate[],
 *   notification?: { variants, fallbackUsed, safetyFlags } | null
 * }
 */
router.post("/slow-time/trigger", triggerSlowTimeTemplate);

export default router;
