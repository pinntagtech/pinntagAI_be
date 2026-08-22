import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import {
  generateBugDescription,
  refreshBugDescription,
} from "../controllers/bugReportController.js";

const router = Router();

/**
 * @route POST /bug-report/description
 * @desc AI Assist for the "Report a bug" form — expands the bug title into a
 *       structured description the user can edit before submitting
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 *
 * @body {
 *   title: string (required, min 3 chars) - What the user typed in "What went wrong?",
 *   appType?: "CONSUMER" | "BUSINESS" (default: "CONSUMER"),
 *   screen?: string - Screen/feature the bug happened on (e.g. "Create Offer"),
 *   category?: "crash" | "ui_display" | "performance" | "login_auth" | "payments" |
 *              "notifications" | "location_maps" | "offers_deals" | "media_upload" | "other",
 *   userNotes?: string - Anything already typed in the description box (facts are preserved),
 *   deviceInfo?: {
 *     platform?: string,   // "ios" | "android"
 *     osVersion?: string,
 *     appVersion?: string,
 *     deviceModel?: string
 *   },
 *   businessId?: string - Business app reports only; used for AI usage tracking,
 *   userId?: string - For logging/correlation
 * }
 *
 * @response {
 *   success: boolean,
 *   description: string,
 *   suggestedCategory: string,
 *   suggestedSeverity: "low" | "medium" | "high" | "critical",
 *   fallbackUsed: boolean,
 *   notice?: string,          // present when fallbackUsed — show it as a hint
 *   metadata: {
 *     generatedAt: string,
 *     appType: string,
 *     titleUsed: string,
 *     model: string
 *   }
 * }
 *
 * @example Request:
 * {
 *   "title": "App freezes when I apply a coupon at checkout",
 *   "appType": "CONSUMER",
 *   "screen": "Checkout",
 *   "deviceInfo": { "platform": "ios", "osVersion": "17.2", "appVersion": "2.3.1" }
 * }
 *
 * @example Response:
 * {
 *   "success": true,
 *   "description": "What happened: I was checking out and applied a coupon, and the app froze.\n\nSteps to reproduce:\n1. Open the checkout screen\n2. Enter a coupon code and tap Apply\n3. Wait for the total to update\n\nExpected result: The discount is applied and the total updates.\n\nActual result: The screen freezes and stops responding to taps.\n\nDevice: ios, OS 17.2, app 2.3.1",
 *   "suggestedCategory": "payments",
 *   "suggestedSeverity": "high",
 *   "fallbackUsed": false,
 *   "metadata": {
 *     "generatedAt": "2026-08-22T09:35:00.000Z",
 *     "appType": "CONSUMER",
 *     "titleUsed": "App freezes when I apply a coupon at checkout",
 *     "model": "gpt-4o-mini"
 *   }
 * }
 *
 * Notes:
 * - Never 500s on an AI failure: unusable titles (gibberish/profanity) and model
 *   errors return 200 with a fill-in-the-blanks template, fallbackUsed: true and
 *   a `notice` string for the UI.
 * - The model is instructed not to invent details; unknown specifics come back as
 *   bracketed placeholders like [add the exact step].
 */
router.post("/description", internalApiKeyGuard, generateBugDescription);

/**
 * @route POST /bug-report/description/refresh
 * @desc Regenerate the description for the same title with different phrasing
 * @access Protected (internal API key)
 * @header x-internal-api-key: string (required)
 *
 * @body Same as POST /bug-report/description
 * @response Same as POST /bug-report/description
 */
router.post("/description/refresh", internalApiKeyGuard, refreshBugDescription);

export default router;
