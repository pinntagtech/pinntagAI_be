import { Request, Response } from "express";
import mongoose from "mongoose";
import { reviewChatService } from "../services/reviewChat.service.js";
import { ReviewChatFeedbackModel } from "../../models/reviewChatFeedback.model.js";
import { logger } from "../../utils/logger.js";

class ReviewChatController {
  /**
   * POST /review-chat/chat
   * Body: { businessId, question | message, sessionId? }
   *   - `question` is the canonical field; `message` is accepted as an alias
   *     for backward compatibility (question wins if both are present).
   */
  async chat(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId, question, message, sessionId } = req.body || {};
      const userQuestion = question ?? message;

      if (!businessId) {
        return res
          .status(400)
          .json({ success: false, error: "businessId is required" });
      }
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid businessId" });
      }
      if (!userQuestion || typeof userQuestion !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "question is required" });
      }
      if (userQuestion.length > 2000) {
        return res.status(400).json({
          success: false,
          error: "question must be ≤ 2000 characters",
        });
      }

      const result = await reviewChatService.chat({
        businessId,
        message: userQuestion,
        sessionId,
      });

      return res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: req.body?.businessId },
        "Review chat failed"
      );
      const status = error.message === "Business not found" ? 404 : 500;
      return res
        .status(status)
        .json({ success: false, error: error.message || "Internal error" });
    }
  }

  /**
   * POST /review-chat/feedback
   * Body: { messageId, businessId, userId, rating: "up" | "down",
   *         sessionId?, reason?, sources?, abstained? }
   *
   * Thumbs up / down on a specific chat answer. Re-rating the same message by
   * the same user OVERWRITES the previous rating (upsert on messageId+userId),
   * so we never store duplicate rows. We collect this from day one even though
   * the dashboard is future work — the data has to exist before we can analyze
   * it.
   */
  async feedback(req: Request, res: Response): Promise<Response> {
    try {
      const {
        messageId,
        businessId,
        userId,
        rating,
        sessionId,
        reason,
        sources,
        abstained,
      } = req.body || {};

      // ── Required field validation (400 on any missing/invalid) ────────────
      if (!messageId || typeof messageId !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "messageId is required" });
      }
      if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
        return res
          .status(400)
          .json({ success: false, error: "Valid businessId is required" });
      }
      if (!userId || typeof userId !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "userId is required" });
      }
      if (rating !== "up" && rating !== "down") {
        return res
          .status(400)
          .json({ success: false, error: 'rating must be "up" or "down"' });
      }
      if (reason !== undefined && typeof reason !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "reason must be a string" });
      }

      // Upsert keyed on (messageId, userId): same user re-rating the same
      // message overwrites their previous rating instead of inserting a dup.
      const doc = await ReviewChatFeedbackModel.findOneAndUpdate(
        { messageId, userId },
        {
          $set: {
            messageId,
            userId,
            business: new mongoose.Types.ObjectId(businessId),
            rating,
            sessionId: typeof sessionId === "string" ? sessionId : undefined,
            reason: typeof reason === "string" ? reason.slice(0, 500) : undefined,
            sources: Array.isArray(sources) ? sources : undefined,
            abstained: typeof abstained === "boolean" ? abstained : undefined,
          },
        },
        { upsert: true, new: true },
      );

      logger.info(
        { messageId, userId, businessId, rating },
        "Review chat feedback recorded",
      );

      return res.status(200).json({ success: true, data: { id: doc?._id } });
    } catch (error: any) {
      logger.error(
        { error: error.message, messageId: req.body?.messageId },
        "Feedback recording failed",
      );
      return res
        .status(500)
        .json({ success: false, error: error.message || "Internal error" });
    }
  }

  /**
   * POST /review-chat/summary/:businessId/regenerate
   * Fetch the latest stored summary for a business. Pure read — never
   * triggers generation. Returns 200 with `data: null` when none exists.
   */
  async getSummary(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid businessId" });
      }

      const summary = await reviewChatService.getSummary(businessId);
      return res.json({ success: true, data: summary });
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: req.params?.businessId },
        "Fetch summary failed",
      );
      return res
        .status(500)
        .json({ success: false, error: error.message || "Internal error" });
    }
  }

  /**
   * GET /review-chat/abstain-stats
   * Query: ?from=ISO&to=ISO&businessId=...  (all optional; default last 7 days)
   * Returns overall + per-business abstain rate with a low/ok/high health flag.
   */
  async abstainStats(req: Request, res: Response): Promise<Response> {
    try {
      const { from, to, businessId } = req.query as Record<string, string>;

      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;
      if (fromDate && isNaN(fromDate.getTime())) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid 'from' date" });
      }
      if (toDate && isNaN(toDate.getTime())) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid 'to' date" });
      }

      const stats = await reviewChatService.getAbstainStats({
        from: fromDate,
        to: toDate,
        businessId,
      });
      return res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error(
        { error: error.message },
        "Abstain stats query failed",
      );
      return res
        .status(500)
        .json({ success: false, error: error.message || "Internal error" });
    }
  }

  /**
   * Force-regenerates the cached summary. Useful after ingest or for ops.
   */
  async regenerateSummary(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid businessId" });
      }

      const summary = await reviewChatService.generateSummary(
        new mongoose.Types.ObjectId(businessId)
      );

      if (!summary) {
        return res.status(404).json({
          success: false,
          error: "No reviews available to summarize",
        });
      }

      return res.json({ success: true, data: summary });
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: req.params?.businessId },
        "Summary regeneration failed"
      );
      return res
        .status(500)
        .json({ success: false, error: error.message || "Internal error" });
    }
  }
}

export const reviewChatController = new ReviewChatController();
