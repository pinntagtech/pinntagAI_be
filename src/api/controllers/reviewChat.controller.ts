import { Request, Response } from "express";
import mongoose from "mongoose";
import { reviewChatService } from "../services/reviewChat.service.js";
import { ReviewChatFeedbackModel } from "../../models/reviewChatFeedback.model.js";
import { logger } from "../../utils/logger.js";

class ReviewChatController {
  /**
   * POST /review-chat/chat
   * Body: { businessId, message, sessionId? }
   */
  async chat(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId, message, sessionId } = req.body || {};

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
      if (!message || typeof message !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "message is required" });
      }
      if (message.length > 2000) {
        return res.status(400).json({
          success: false,
          error: "message must be ≤ 2000 characters",
        });
      }

      const result = await reviewChatService.chat({
        businessId,
        message,
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
   * Body: { sessionId, businessId, rating: 1 | -1, reason?, sources?, abstained? }
   *
   * Thumbs up / down on a previous chat response. We collect this from
   * day one even though the dashboard is future work — the data has to
   * exist before we can analyze it.
   */
  async feedback(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionId, businessId, rating, reason, sources, abstained } =
        req.body || {};

      if (!sessionId || typeof sessionId !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "sessionId is required" });
      }
      if (!businessId || !mongoose.Types.ObjectId.isValid(businessId)) {
        return res
          .status(400)
          .json({ success: false, error: "Valid businessId is required" });
      }
      if (rating !== 1 && rating !== -1) {
        return res
          .status(400)
          .json({ success: false, error: "rating must be 1 or -1" });
      }
      if (reason !== undefined && typeof reason !== "string") {
        return res
          .status(400)
          .json({ success: false, error: "reason must be a string" });
      }

      const doc = await ReviewChatFeedbackModel.create({
        sessionId,
        business: new mongoose.Types.ObjectId(businessId),
        rating,
        reason: reason?.slice(0, 500),
        sources: Array.isArray(sources) ? sources : undefined,
        abstained: typeof abstained === "boolean" ? abstained : undefined,
      });

      logger.info(
        { sessionId, businessId, rating, abstained },
        "Review chat feedback recorded",
      );

      return res.json({ success: true, data: { id: doc._id } });
    } catch (error: any) {
      logger.error(
        { error: error.message, sessionId: req.body?.sessionId },
        "Feedback recording failed",
      );
      return res
        .status(500)
        .json({ success: false, error: error.message || "Internal error" });
    }
  }

  /**
   * POST /review-chat/summary/:businessId/regenerate
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
