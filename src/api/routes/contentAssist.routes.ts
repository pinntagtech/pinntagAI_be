import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import {
  generateTitles,
  generateDescription,
  refreshTitles,
  generateNotificationCopy,
} from "../controllers/contentAssistController.js";

const router = Router();

// ===========================
// All routes protected by internal API key
// ===========================

/**
 * @route POST /content-assist/titles
 * @desc Generate AI-powered title suggestions for content creation
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 *
 * @body {
 *   businessId: string (required) - The business ID,
 *   contentType: "offer" | "flashdeal" | "specials" | "drop_pin" | "event" (required),
 *   category?: string (e.g., "Food & Drink Specials", "Live Music"),
 *   subCategory?: string (e.g., "Happy Hour", "Acoustic Set"),
 *   tags?: string[],
 *   promotionType?: "percent_off" | "dollar_off" | "bogo" | "free_item" | "happy_hour" | "combo_bundle" | "custom_deal" | "family_fun",
 *   percentOffValue?: number (when promotionType is "percent_off", e.g., 20 for 20% off),
 *   dollarOffValue?: number (when promotionType is "dollar_off", e.g., 5 for $5 off),
 *   bogoOrFreeItem?: string (when promotionType is "bogo" or "free_item", e.g., "appetizer", "drink"),
 *   count?: number (default: 5, max: 10)
 * }
 *
 * @response {
 *   success: boolean,
 *   titles: string[],
 *   metadata: {
 *     businessName: string,
 *     generatedAt: string,
 *     contentType: string,
 *     count: number
 *   }
 * }
 *
 * @example Request:
 * {
 *   "businessId": "507f1f77bcf86cd799439011",
 *   "contentType": "event",
 *   "category": "Live Music",
 *   "subCategory": "Acoustic Set",
 *   "tags": ["weekend", "relaxing"],
 *   "count": 5
 * }
 *
 * @example Response:
 * {
 *   "success": true,
 *   "titles": [
 *     "Acoustic Night: Wine & Melodies",
 *     "Unwind with Live Acoustic Vibes",
 *     "Weekend Serenade Awaits",
 *     "Acoustic Sessions: Perfect Evening Out",
 *     "Live Music Under the Stars"
 *   ],
 *   "metadata": {
 *     "businessName": "The Rustic Vine",
 *     "generatedAt": "2026-01-23T15:30:00.000Z",
 *     "contentType": "event",
 *     "count": 5
 *   }
 * }
 */
router.post("/titles", internalApiKeyGuard, generateTitles);

/**
 * @route POST /content-assist/titles/refresh
 * @desc Refresh/regenerate title suggestions (same inputs, new outputs)
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 *
 * @body {
 *   businessId: string (required) - The business ID,
 *   contentType: "offer" | "flashdeal" | "specials" | "drop_pin" | "event" (required),
 *   category?: string,
 *   subCategory?: string,
 *   tags?: string[],
 *   promotionType?: "percent_off" | "dollar_off" | "bogo" | "free_item" | "happy_hour" | "combo_bundle" | "custom_deal" | "family_fun",
 *   percentOffValue?: number,
 *   dollarOffValue?: number,
 *   bogoOrFreeItem?: string,
 *   count?: number (default: 5, max: 10),
 *   excludeTitles?: string[] - Previously generated titles to exclude from new results
 * }
 *
 * @response Same as /content-assist/titles
 *
 * @example Request:
 * {
 *   "businessId": "507f1f77bcf86cd799439011",
 *   "contentType": "event",
 *   "category": "Live Music",
 *   "subCategory": "Acoustic Set",
 *   "excludeTitles": [
 *     "Acoustic Night: Wine & Melodies",
 *     "Unwind with Live Acoustic Vibes",
 *     "Weekend Serenade Awaits"
 *   ],
 *   "count": 5
 * }
 *
 * Note: This endpoint adds a refresh seed to ensure new titles are generated
 * even with the same input parameters. Pass excludeTitles array to prevent
 * previously generated titles from appearing in the new results.
 */
router.post("/titles/refresh", internalApiKeyGuard, refreshTitles);

/**
 * @route POST /content-assist/description
 * @desc Generate AI-powered description based on selected title
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 *
 * @body {
 *   businessId: string (required) - The business ID,
 *   title: string (required) - The selected headline,
 *   contentType: "offer" | "flashdeal" | "specials" | "drop_pin" | "event" (required),
 *   category?: string,
 *   subCategory?: string,
 *   tags?: string[],
 *   promotionType?: "percent_off" | "dollar_off" | "bogo" | "free_item" | "happy_hour" | "combo_bundle" | "custom_deal" | "family_fun"
 * }
 *
 * @response {
 *   success: boolean,
 *   description: string,
 *   metadata: {
 *     businessName: string,
 *     generatedAt: string,
 *     contentType: string,
 *     titleUsed: string
 *   }
 * }
 *
 * @example Request:
 * {
 *   "businessId": "507f1f77bcf86cd799439011",
 *   "title": "Acoustic Night: Wine & Melodies",
 *   "contentType": "event",
 *   "category": "Live Music",
 *   "subCategory": "Acoustic Set"
 * }
 *
 * @example Response:
 * {
 *   "success": true,
 *   "description": "Join us for an enchanting evening where soulful acoustic melodies meet our finest wine selection. Settle into the warm ambiance as talented local artists create the perfect backdrop for an unforgettable night. Whether you're catching up with friends or enjoying a quiet date night, this is the weekend escape you've been looking for.",
 *   "metadata": {
 *     "businessName": "The Rustic Vine",
 *     "generatedAt": "2026-01-23T15:31:00.000Z",
 *     "contentType": "event",
 *     "titleUsed": "Acoustic Night: Wine & Melodies"
 *   }
 * }
 */
router.post("/description", internalApiKeyGuard, generateDescription);

/**
 * @route POST /content-assist/notification-copy
 * @desc Generate AI-powered notification copy variants for push notifications
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 *
 * @body {
 *   appType: "CONSUMER" | "BUSINESS" (required) - Target app,
 *   triggerType: string (required) - One of:
 *     "offer_expiring" | "offer_viewed_not_redeemed" | "reward_progress" |
 *     "new_event_nearby" | "business_inactivity" | "business_new_review" |
 *     "weekend_events" | "lunch_deals" | "weekly_summary",
 *   context: {
 *     offerName?: string,
 *     eventName?: string,
 *     businessName?: string,
 *     businessId?: string,
 *     category?: string,
 *     timeWindow?: string,
 *     distanceBucket?: string (e.g., "<1km", "1-5km"),
 *     cityArea?: string,
 *     expiresIn?: string (e.g., "2 hours", "tomorrow"),
 *     rewardProgress?: number,
 *     rewardTarget?: number,
 *     rewardName?: string,
 *     daysSinceLastPost?: number,
 *     newReviewRating?: number,
 *     deepLink?: string
 *   } (required),
 *   tone?: "playful" | "helpful" | "urgent" | "coach" (default: playful for CONSUMER, coach for BUSINESS),
 *   variantCount?: number (default: 5, max: 8),
 *   emojiAllowed?: boolean (default: true)
 * }
 *
 * @response {
 *   success: boolean,
 *   variants: [{
 *     id: string,
 *     title: string (max 50 chars),
 *     body: string (max 150 chars),
 *     tone: string,
 *     hasEmoji: boolean,
 *     urgencyLevel: "low" | "medium" | "high"
 *   }],
 *   fallbackUsed: boolean,
 *   safetyFlags: string[],
 *   metadata: {
 *     appType: string,
 *     triggerType: string,
 *     generatedAt: string,
 *     variantCount: number
 *   }
 * }
 *
 * @example Request (Consumer - Offer Expiring):
 * {
 *   "appType": "CONSUMER",
 *   "triggerType": "offer_expiring",
 *   "context": {
 *     "offerName": "20% Off Lunch",
 *     "businessName": "The Rustic Vine",
 *     "category": "Food & Drink",
 *     "expiresIn": "2 hours",
 *     "deepLink": "pinntag://offer/123"
 *   },
 *   "tone": "playful",
 *   "variantCount": 5,
 *   "emojiAllowed": true
 * }
 *
 * @example Request (Business - Inactivity Nudge):
 * {
 *   "appType": "BUSINESS",
 *   "triggerType": "business_inactivity",
 *   "context": {
 *     "businessName": "Joe's Coffee",
 *     "daysSinceLastPost": 7,
 *     "deepLink": "pinntag://business/456/create"
 *   },
 *   "tone": "coach",
 *   "variantCount": 3
 * }
 *
 * @example Response:
 * {
 *   "success": true,
 *   "variants": [
 *     {
 *       "id": "variant_1",
 *       "title": "Still thinking it over?",
 *       "body": "That Food & Drink deal at The Rustic Vine is waiting. Tap to grab it before it's gone!",
 *       "tone": "playful",
 *       "hasEmoji": false,
 *       "urgencyLevel": "medium"
 *     },
 *     {
 *       "id": "variant_2",
 *       "title": "Deal ending soon",
 *       "body": "20% Off Lunch expires in 2 hours. Don't let this one slip away.",
 *       "tone": "urgent",
 *       "hasEmoji": false,
 *       "urgencyLevel": "high"
 *     }
 *   ],
 *   "fallbackUsed": false,
 *   "safetyFlags": [],
 *   "metadata": {
 *     "appType": "CONSUMER",
 *     "triggerType": "offer_expiring",
 *     "generatedAt": "2026-01-31T15:30:00.000Z",
 *     "variantCount": 2
 *   }
 * }
 *
 * Safety Notes:
 * - Copy is filtered for shaming language, sensitive inference, and deceptive claims
 * - If AI fails or all variants are filtered, safe fallback templates are returned
 * - Title max 50 chars, body max 150 chars (enforced)
 */
router.post("/notification-copy", internalApiKeyGuard, generateNotificationCopy);

export default router;
