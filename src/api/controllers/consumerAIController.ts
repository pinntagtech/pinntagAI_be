import { Request, Response } from "express";
import mongoose from "mongoose";
import { consumerAIService } from "../services/consumerAI.service.js";
import { logger } from "../../utils/logger.js";

/**
 * Consumer AI Controller - handles all consumer AI chat endpoints
 */
export class ConsumerAIController {
  /**
   * POST /consumer-ai/chat
   * Main chat endpoint for consumer AI
   */
  async chat(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, message, sessionId, location } = req.body;

      // Validate required fields
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "userId is required",
        });
      }

      if (!message || typeof message !== "string") {
        return res.status(400).json({
          success: false,
          error: "message is required and must be a string",
        });
      }

      if (message.length > 2000) {
        return res.status(400).json({
          success: false,
          error: "message must be less than 2000 characters",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid userId format. Must be a valid MongoDB ObjectId",
        });
      }

      const response = await consumerAIService.chat({
        userId,
        message,
        sessionId,
        location,
      });

      return res.json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, userId: req.body?.userId },
        "Consumer AI chat failed"
      );
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to process chat message",
      });
    }
  }

  /**
   * GET /consumer-ai/profile/:userId
   * Get user profile summary including preferences and stats
   */
  async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid userId format. Must be a valid MongoDB ObjectId",
        });
      }

      const profile = await consumerAIService.getProfileSummary(userId);

      return res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, userId: req.params.userId },
        "Failed to get consumer profile"
      );
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to get profile",
      });
    }
  }

  /**
   * GET /consumer-ai/history/:userId
   * Get conversation history for a user
   */
  async getHistory(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { sessionId, limit = "10" } = req.query as {
        sessionId?: string;
        limit?: string;
      };

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid userId format. Must be a valid MongoDB ObjectId",
        });
      }

      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          error: "limit must be a number between 1 and 100",
        });
      }

      const history = await consumerAIService.getConversationHistory(
        userId,
        sessionId,
        parsedLimit
      );

      return res.json({
        success: true,
        data: {
          userId,
          conversations: history,
          count: history.length,
        },
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, userId: req.params.userId },
        "Failed to get conversation history"
      );
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to get conversation history",
      });
    }
  }

  /**
   * DELETE /consumer-ai/history/:userId
   * Clear conversation history for privacy
   */
  async clearHistory(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { sessionId } = req.query as { sessionId?: string };

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid userId format. Must be a valid MongoDB ObjectId",
        });
      }

      await consumerAIService.clearHistory(userId, sessionId);

      return res.json({
        success: true,
        message: sessionId
          ? `Cleared conversation ${sessionId}`
          : "Cleared all conversation history",
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, userId: req.params.userId },
        "Failed to clear history"
      );
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to clear history",
      });
    }
  }

  /**
   * POST /consumer-ai/preferences/:userId/sync
   * Sync preferences from engagement data
   */
  async syncPreferences(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid userId format. Must be a valid MongoDB ObjectId",
        });
      }

      await consumerAIService.updatePreferencesFromEngagement(userId);

      // Return updated profile
      const profile = await consumerAIService.getProfileSummary(userId);

      return res.json({
        success: true,
        message: "Preferences synced from engagement data",
        data: profile,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, userId: req.params.userId },
        "Failed to sync preferences"
      );
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to sync preferences",
      });
    }
  }

  /**
   * POST /consumer-ai/preferences/:userId
   * Add explicit user preference
   */
  async addPreference(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { type, value } = req.body;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid userId format. Must be a valid MongoDB ObjectId",
        });
      }

      if (!type || !["interest", "dislike"].includes(type)) {
        return res.status(400).json({
          success: false,
          error: "type is required and must be 'interest' or 'dislike'",
        });
      }

      if (!value || typeof value !== "string") {
        return res.status(400).json({
          success: false,
          error: "value is required and must be a string",
        });
      }

      await consumerAIService.addExplicitPreference(userId, type, value);

      return res.json({
        success: true,
        message: `Added ${type}: ${value}`,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, userId: req.params.userId },
        "Failed to add preference"
      );
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to add preference",
      });
    }
  }
}

export const consumerAIController = new ConsumerAIController();
