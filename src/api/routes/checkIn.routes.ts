import { Router } from "express";
import { generateCheckInTitles } from "../controllers/checkInController.js";

const router = Router();

// ===========================
// Check-In Routes
// ===========================

/**
 * @route POST /checkin/suggest-titles
 * @desc Generate AI-suggested check-in titles based on business metadata
 * @body {
 *   businessId: string (required) - The business ID
 * }
 * @response {
 *   success: boolean,
 *   suggestions: string[] (10 suggestions, each 7-8 characters + emoji),
 *   metadata: {
 *     businessName: string,
 *     generatedAt: string
 *   }
 * }
 *
 * @example Request:
 * {
 *   "businessId": "biz_123456"
 * }
 *
 * @example Response:
 * {
 *   "success": true,
 *   "suggestions": [
 *     "Awesome ✨",
 *     "Vibing 🎵",
 *     "Loving ❤️",
 *     "Chillin 😎",
 *     "Perfect 👌",
 *     "Amazing 🌟",
 *     "Great 👍",
 *     "Stellar ⭐",
 *     "Epic 🔥",
 *     "Blessed 🙏"
 *   ],
 *   "metadata": {
 *     "businessName": "Curry Pizza House",
 *     "generatedAt": "2025-12-29T10:30:00.000Z"
 *   }
 * }
 *
 * Note: The API generates titles based on the business's:
 * - Name
 * - Description
 * - Category
 * - Sub-categories
 * - Tags
 *
 * All titles are 7-8 characters long and include an emoji.
 */
router.post("/suggest-titles", generateCheckInTitles);

export default router;
