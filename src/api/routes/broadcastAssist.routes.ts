import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import {
  generateBroadcastDescription,
  refreshBroadcastDescription,
} from "../controllers/broadcastAssistController.js";

const router = Router();

/**
 * @route POST /broadcast-assist/description
 * @desc AI Assist for the broadcast composer — turns the broadcast title into
 *       the message body the business can edit before sending
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 *
 * Not to be confused with POST /ai-assist/broadcast, which needs
 * businessId + purpose + keyMessage and returns a whole content object
 * (title, description, CTA). This endpoint needs only the title.
 *
 * @body {
 *   title: string (required, min 3 chars) - The broadcast title the user typed,
 *   businessId?: string - Optional but recommended: pulls brand voice, category
 *                         and audience from AI training so the copy isn't generic.
 *                         Silently ignored if the business has no assistant yet.
 *   purpose?: "announcement" | "update" | "reminder" | "promotion" | "general" (default: "announcement"),
 *   tone?: "professional" | "casual" | "friendly" | "exciting" | "urgent" (default: "friendly"),
 *   length?: "short" | "standard" (default: "standard") - short: 40 words / 280 chars,
 *                                                        standard: 80 words / 500 chars,
 *   keyPoints?: string[] - Facts to include (max 5). Nothing outside these is invented,
 *   callToAction?: string - What the reader should do next (e.g. "book a table"),
 *   emojiAllowed?: boolean (default: false) - Allows at most one emoji
 * }
 *
 * @response {
 *   success: boolean,
 *   description: string,
 *   fallbackUsed: boolean,
 *   notice?: string,          // present when fallbackUsed — show it as a hint
 *   metadata: {
 *     generatedAt: string,
 *     titleUsed: string,
 *     purpose: string,
 *     tone: string,
 *     characterCount: number,
 *     businessName?: string,  // only when businessId resolved
 *     model: string
 *   }
 * }
 *
 * @example Request:
 * {
 *   "title": "Closed this Saturday for a private event",
 *   "businessId": "507f1f77bcf86cd799439011",
 *   "purpose": "announcement",
 *   "tone": "friendly"
 * }
 *
 * @example Response:
 * {
 *   "success": true,
 *   "description": "Our doors will be shut this Saturday while we host a private event, so we won't be open for walk-ins. We'll be back to normal hours on Sunday morning with the full menu. Thanks for bearing with us — see you right after!",
 *   "fallbackUsed": false,
 *   "metadata": {
 *     "generatedAt": "2026-08-25T10:12:00.000Z",
 *     "titleUsed": "Closed this Saturday for a private event",
 *     "purpose": "announcement",
 *     "tone": "friendly",
 *     "characterCount": 221,
 *     "businessName": "The Rustic Vine",
 *     "model": "gpt-4o-mini"
 *   }
 * }
 *
 * Notes:
 * - Never 500s on an AI failure: unusable titles (gibberish/profanity) and model
 *   errors return 200 with a scaffold, fallbackUsed: true and a `notice` string.
 * - Missing details come back as bracketed placeholders like [add the date]
 *   rather than invented dates, prices or times.
 */
router.post("/description", internalApiKeyGuard, generateBroadcastDescription);

/**
 * @route POST /broadcast-assist/description/refresh
 * @desc Regenerate the message with a different angle, same facts
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 *
 * @body Same as POST /broadcast-assist/description
 * @response Same as POST /broadcast-assist/description
 */
router.post(
  "/description/refresh",
  internalApiKeyGuard,
  refreshBroadcastDescription,
);

export default router;
