import { Router } from "express";
import { reviewChatController } from "../controllers/reviewChat.controller.js";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import { reviewChatRateLimit } from "../../middleware/reviewChatRateLimit.js";

const router = Router();

// ── Routes ───────────────────────────────────────────────────────────────────

router.use(internalApiKeyGuard);

/**
 * POST /review-chat/chat
 * Ask a question about a specific business based on its reviews.
 * Body: { businessId, question, sessionId? }   ("message" accepted as alias)
 * Returns: {
 *   success: true,
 *   data: {
 *     sessionId: string,
 *     response: string,
 *     sources: ("profile" | "reviews" | "none")[],
 *     abstained: boolean,
 *     metadata: { tokensUsed, summaryGenerated, reviewCount }
 *   }
 * }
 */
router.post("/chat", reviewChatRateLimit, (req, res) =>
  reviewChatController.chat(req, res)
);

/**
 * POST /review-chat/feedback
 * Thumbs up / down on a specific chat answer.
 * Body: { messageId, businessId, userId, rating: "up" | "down",
 *         sessionId?, reason?, sources?, abstained? }
 * Re-rating the same message by the same user overwrites the prior rating.
 * Returns 200 on success, 400 on missing/invalid required fields.
 */
router.post("/feedback", (req, res) =>
  reviewChatController.feedback(req, res),
);

/**
 * GET /review-chat/abstain-stats
 * Abstain-rate monitoring. Query: ?from=ISO&to=ISO&businessId= (all optional).
 * Returns overall + per-business rate with a low/ok/high flag (5%–30% band).
 */
router.get("/abstain-stats", (req, res) =>
  reviewChatController.abstainStats(req, res),
);

/**
 * GET /review-chat/summary/:businessId
 * Fetch the latest stored summary for a business (pure read).
 * Returns { data: null } if none exists yet.
 */
router.get("/summary/:businessId", (req, res) =>
  reviewChatController.getSummary(req, res),
);

/**
 * POST /review-chat/summary/:businessId/regenerate
 * Force regenerate the cached summary for a business.
 * Used by ops / after fresh review ingest.
 */
router.post("/summary/:businessId/regenerate", (req, res) =>
  reviewChatController.regenerateSummary(req, res)
);

export { router as reviewChatRoutes };
