import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import {
  generateTitles,
  generateDescription,
  refreshTitles,
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
 *   contentType: "offer" | "flashdeal" | "spotlight" | "dropped_pin" | "business_event" (required),
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
 *   contentType: "offer" | "flashdeal" | "spotlight" | "dropped_pin" | "business_event" (required),
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
 *   contentType: "offer" | "flashdeal" | "spotlight" | "dropped_pin" | "business_event" (required),
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

export default router;
