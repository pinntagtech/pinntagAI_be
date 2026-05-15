import { Router, Request, Response, NextFunction } from "express";
import { reviewChatController } from "../controllers/reviewChat.controller.js";
import { internalApiKeyGuard } from "../../middleware/auth.js";

const router = Router();

// ── In-memory rate limiter ───────────────────────────────────────────────────
// Consumer chat is expensive (LLM calls). Cap usage per IP to prevent abuse.
// Window: 60s. Limit: 20 requests. Replaced with Redis when available.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimitChat(req: Request, res: Response, next: NextFunction) {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please wait a moment.",
    });
  }

  entry.count++;
  return next();
}

// Periodic cleanup of expired entries to prevent unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipHits) {
    if (entry.resetAt < now) ipHits.delete(ip);
  }
}, 5 * 60 * 1000).unref();

// ── Routes ───────────────────────────────────────────────────────────────────

router.use(internalApiKeyGuard);

/**
 * POST /review-chat/chat
 * Ask a question about a specific business based on its reviews.
 * Body: { businessId, message, sessionId? }
 */
router.post("/chat", rateLimitChat, (req, res) =>
  reviewChatController.chat(req, res)
);

/**
 * POST /review-chat/feedback
 * Thumbs up / down on a previous chat response.
 * Body: { sessionId, businessId, rating: 1 | -1, reason?, sources?, abstained? }
 */
router.post("/feedback", (req, res) =>
  reviewChatController.feedback(req, res),
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
