import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  engagementService,
  TrackEngagementInput,
} from "../services/engagement.service.js";
import {
  EngagementActionType,
  EngagementSource,
} from "../../models/engagement.model.js";
import { logger } from "../../utils/logger.js";

/**
 * Engagement Controller - handles all engagement tracking API endpoints
 */
export class EngagementController {
  /**
   * POST /engagement/track
   * Track a single engagement action
   */
  async trackEngagement(req: Request, res: Response): Promise<Response> {
    try {
      const {
        eventId,
        businessId,
        userId,
        actionType,
        source,
        sessionId,
        deviceType,
        referrer,
        metadata,
        location,
      } = req.body;

      // Validate required fields
      if (!eventId) {
        return res.status(400).json({
          success: false,
          error: "eventId is required",
        });
      }

      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "businessId is required",
        });
      }

      if (!actionType) {
        return res.status(400).json({
          success: false,
          error: "actionType is required",
        });
      }

      // Validate actionType enum
      if (!Object.values(EngagementActionType).includes(actionType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid actionType. Allowed values: ${Object.values(EngagementActionType).join(", ")}`,
        });
      }

      // Validate source enum if provided
      if (source && !Object.values(EngagementSource).includes(source)) {
        return res.status(400).json({
          success: false,
          error: `Invalid source. Allowed values: ${Object.values(EngagementSource).join(", ")}`,
        });
      }

      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid eventId format. Must be a valid MongoDB ObjectId",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid businessId format. Must be a valid MongoDB ObjectId",
        });
      }

      if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid userId format. Must be a valid MongoDB ObjectId",
        });
      }

      const input: TrackEngagementInput = {
        eventId,
        businessId,
        userId,
        actionType,
        source,
        sessionId,
        deviceType,
        referrer,
        metadata,
        location,
      };

      const engagement = await engagementService.trackEngagement(input);

      return res.status(201).json({
        success: true,
        data: engagement,
      });
    } catch (error: any) {
      logger.error({ error: error.message, body: req.body }, "Failed to track engagement");
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to track engagement",
      });
    }
  }

  /**
   * POST /engagement/track/batch
   * Track multiple engagements in batch
   */
  async trackBatch(req: Request, res: Response): Promise<Response> {
    try {
      const { engagements } = req.body;

      if (!engagements || !Array.isArray(engagements)) {
        return res.status(400).json({
          success: false,
          error: "engagements must be an array",
        });
      }

      if (engagements.length === 0) {
        return res.status(400).json({
          success: false,
          error: "engagements array cannot be empty",
        });
      }

      if (engagements.length > 1000) {
        return res.status(400).json({
          success: false,
          error: "Maximum batch size is 1000 engagements",
        });
      }

      // Validate each engagement
      for (let i = 0; i < engagements.length; i++) {
        const eng = engagements[i];

        if (!eng.eventId || !eng.businessId || !eng.actionType) {
          return res.status(400).json({
            success: false,
            error: `Engagement at index ${i} is missing required fields (eventId, businessId, actionType)`,
          });
        }

        if (!Object.values(EngagementActionType).includes(eng.actionType)) {
          return res.status(400).json({
            success: false,
            error: `Invalid actionType at index ${i}. Allowed values: ${Object.values(EngagementActionType).join(", ")}`,
          });
        }
      }

      const result = await engagementService.trackBatch({ engagements });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error({ error: error.message }, "Failed to track batch engagement");
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to track batch engagement",
      });
    }
  }

  /**
   * GET /engagement/event/:eventId/summary
   * Get engagement summary for an event
   */
  async getEventSummary(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid eventId format. Must be a valid MongoDB ObjectId",
        });
      }

      const summary = await engagementService.getEventSummary(eventId);

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, eventId: req.params.eventId },
        "Failed to get event summary"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get event summary",
      });
    }
  }

  /**
   * GET /engagement/business/:businessId/summary
   * Get engagement summary for a business (all events)
   */
  async getBusinessSummary(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid businessId format. Must be a valid MongoDB ObjectId",
        });
      }

      const summary = await engagementService.getBusinessSummary(businessId);

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: req.params.businessId },
        "Failed to get business summary"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get business summary",
      });
    }
  }

  /**
   * GET /engagement/event/:eventId/timeseries
   * Get time-series engagement data for an event
   */
  async getEventTimeSeries(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params;
      const {
        startDate,
        endDate,
        granularity = "day",
      } = req.query as {
        startDate?: string;
        endDate?: string;
        granularity?: "hour" | "day" | "week" | "month";
      };

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid eventId format. Must be a valid MongoDB ObjectId",
        });
      }

      // Default to last 30 days if no dates provided
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate
        ? new Date(startDate)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format. Use ISO 8601 format (e.g., 2024-01-01)",
        });
      }

      if (!["hour", "day", "week", "month"].includes(granularity)) {
        return res.status(400).json({
          success: false,
          error: "Invalid granularity. Allowed values: hour, day, week, month",
        });
      }

      const timeSeries = await engagementService.getEventTimeSeries(
        eventId,
        start,
        end,
        granularity
      );

      return res.json({
        success: true,
        data: {
          eventId,
          startDate: start,
          endDate: end,
          granularity,
          timeSeries,
        },
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, eventId: req.params.eventId },
        "Failed to get event time series"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get event time series",
      });
    }
  }

  /**
   * GET /engagement/event/:eventId/user/:userId/status
   * Get user's engagement status for an event
   */
  async getUserEventStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId, userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid eventId format. Must be a valid MongoDB ObjectId",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid userId format. Must be a valid MongoDB ObjectId",
        });
      }

      const status = await engagementService.getUserEventStatus(eventId, userId);

      return res.json({
        success: true,
        data: {
          eventId,
          userId,
          ...status,
        },
      });
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          eventId: req.params.eventId,
          userId: req.params.userId,
        },
        "Failed to get user event status"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get user event status",
      });
    }
  }

  /**
   * GET /engagement
   * List engagements with filtering and pagination
   */
  async listEngagements(req: Request, res: Response): Promise<Response> {
    try {
      const {
        eventId,
        businessId,
        userId,
        actionType,
        source,
        startDate,
        endDate,
        limit = "50",
        offset = "0",
      } = req.query as Record<string, string | undefined>;

      const query: any = {};

      if (eventId) query.eventId = eventId;
      if (businessId) query.businessId = businessId;
      if (userId) query.userId = userId;
      if (actionType) query.actionType = actionType as EngagementActionType;
      if (source) query.source = source as EngagementSource;
      if (startDate) query.startDate = new Date(startDate);
      if (endDate) query.endDate = new Date(endDate);
      query.limit = parseInt(limit, 10);
      query.offset = parseInt(offset, 10);

      // Validate actionType if provided
      if (actionType && !Object.values(EngagementActionType).includes(actionType as EngagementActionType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid actionType. Allowed values: ${Object.values(EngagementActionType).join(", ")}`,
        });
      }

      const result = await engagementService.listEngagements(query);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, query: req.query },
        "Failed to list engagements"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to list engagements",
      });
    }
  }

  /**
   * GET /engagement/business/:businessId/top-events
   * Get top events by engagement for a business
   */
  async getTopEventsByEngagement(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const { limit = "10", actionType } = req.query as {
        limit?: string;
        actionType?: EngagementActionType;
      };

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid businessId format. Must be a valid MongoDB ObjectId",
        });
      }

      // Validate actionType if provided
      if (actionType && !Object.values(EngagementActionType).includes(actionType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid actionType. Allowed values: ${Object.values(EngagementActionType).join(", ")}`,
        });
      }

      const topEvents = await engagementService.getTopEventsByEngagement(
        businessId,
        parseInt(limit, 10),
        actionType
      );

      return res.json({
        success: true,
        data: {
          businessId,
          topEvents,
        },
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: req.params.businessId },
        "Failed to get top events"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get top events",
      });
    }
  }

  /**
   * GET /engagement/event/:eventId/by-source
   * Get engagement breakdown by source for an event
   */
  async getEngagementBySource(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid eventId format. Must be a valid MongoDB ObjectId",
        });
      }

      const breakdown = await engagementService.getEngagementBySource(eventId);

      return res.json({
        success: true,
        data: {
          eventId,
          breakdown,
        },
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, eventId: req.params.eventId },
        "Failed to get engagement by source"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get engagement by source",
      });
    }
  }

  /**
   * GET /engagement/event/:eventId/by-device
   * Get engagement breakdown by device type for an event
   */
  async getEngagementByDevice(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid eventId format. Must be a valid MongoDB ObjectId",
        });
      }

      const breakdown = await engagementService.getEngagementByDevice(eventId);

      return res.json({
        success: true,
        data: {
          eventId,
          breakdown,
        },
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, eventId: req.params.eventId },
        "Failed to get engagement by device"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get engagement by device",
      });
    }
  }

  /**
   * GET /engagement/event/:eventId/realtime
   * Get real-time engagement counts for an event
   */
  async getRealtimeEngagement(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params;
      const { minutesAgo = "60" } = req.query as { minutesAgo?: string };

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid eventId format. Must be a valid MongoDB ObjectId",
        });
      }

      const minutes = parseInt(minutesAgo, 10);
      if (isNaN(minutes) || minutes <= 0 || minutes > 1440) {
        return res.status(400).json({
          success: false,
          error: "minutesAgo must be a positive number (max 1440 = 24 hours)",
        });
      }

      const realtime = await engagementService.getRealtimeEngagement(
        eventId,
        minutes
      );

      return res.json({
        success: true,
        data: {
          eventId,
          minutesAgo: minutes,
          ...realtime,
        },
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, eventId: req.params.eventId },
        "Failed to get realtime engagement"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get realtime engagement",
      });
    }
  }

  /**
   * DELETE /engagement/event/:eventId
   * Delete all engagements for an event (admin only)
   */
  async deleteEventEngagements(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid eventId format. Must be a valid MongoDB ObjectId",
        });
      }

      const result = await engagementService.deleteEventEngagements(eventId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, eventId: req.params.eventId },
        "Failed to delete event engagements"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to delete event engagements",
      });
    }
  }

  // ============================================================================
  // AI TRAINING ANALYTICS ENDPOINTS
  // ============================================================================

  /**
   * GET /engagement/business/:businessId/ai-training-analytics
   * Get comprehensive engagement analytics for AI training
   */
  async getAITrainingAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const { daysBack = "90" } = req.query as { daysBack?: string };

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid businessId format. Must be a valid MongoDB ObjectId",
        });
      }

      const days = parseInt(daysBack, 10);
      if (isNaN(days) || days <= 0 || days > 365) {
        return res.status(400).json({
          success: false,
          error: "daysBack must be a positive number (max 365)",
        });
      }

      const analytics = await engagementService.getAITrainingAnalytics(
        businessId,
        days
      );

      return res.json({
        success: true,
        data: {
          businessId,
          daysBack: days,
          analytics,
        },
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: req.params.businessId },
        "Failed to get AI training analytics"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get AI training analytics",
      });
    }
  }

  /**
   * GET /engagement/business/:businessId/ai-training-insights
   * Generate formatted AI training insights text
   */
  async getAITrainingInsights(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid businessId format. Must be a valid MongoDB ObjectId",
        });
      }

      const insights = await engagementService.generateAITrainingInsights(
        businessId
      );

      return res.json({
        success: true,
        data: {
          businessId,
          insights,
        },
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: req.params.businessId },
        "Failed to generate AI training insights"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to generate AI training insights",
      });
    }
  }

  /**
   * GET /engagement/business/:businessId/segment-analytics
   * Get engagement analytics segmented by device, source, or location
   */
  async getUserSegmentAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const { segmentBy = "device" } = req.query as {
        segmentBy?: "device" | "source" | "location";
      };

      if (!mongoose.Types.ObjectId.isValid(businessId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid businessId format. Must be a valid MongoDB ObjectId",
        });
      }

      if (!["device", "source", "location"].includes(segmentBy)) {
        return res.status(400).json({
          success: false,
          error: "Invalid segmentBy. Allowed values: device, source, location",
        });
      }

      const segments = await engagementService.getUserSegmentAnalytics(
        businessId,
        segmentBy
      );

      return res.json({
        success: true,
        data: {
          businessId,
          segmentBy,
          segments,
        },
      });
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: req.params.businessId },
        "Failed to get user segment analytics"
      );
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to get user segment analytics",
      });
    }
  }
}

export const engagementController = new EngagementController();
