import mongoose from "mongoose";
import {
  EngagementModel,
  IEngagement,
  EngagementActionType,
  EngagementSource,
  IEngagementSummary,
  IEngagementTimeSeries,
} from "../../models/engagement.model.js";
import { logger } from "../../utils/logger.js";

/**
 * Input for tracking a single engagement action
 */
export interface TrackEngagementInput {
  eventId: string;
  businessId: string;
  userId?: string;
  actionType: EngagementActionType;
  source?: EngagementSource;
  sessionId?: string;
  deviceType?: string;
  referrer?: string;
  metadata?: Record<string, any>;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Input for batch tracking multiple engagements
 */
export interface BatchTrackInput {
  engagements: TrackEngagementInput[];
}

/**
 * Query parameters for listing engagements
 */
export interface ListEngagementsQuery {
  eventId?: string;
  businessId?: string;
  userId?: string;
  actionType?: EngagementActionType;
  source?: EngagementSource;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Engagement Service - handles all engagement tracking business logic
 */
class EngagementService {
  /**
   * Track a single engagement action
   */
  async trackEngagement(input: TrackEngagementInput): Promise<IEngagement> {
    try {
      // Validate ObjectIds
      if (!mongoose.Types.ObjectId.isValid(input.eventId)) {
        throw new Error("Invalid eventId format");
      }
      if (!mongoose.Types.ObjectId.isValid(input.businessId)) {
        throw new Error("Invalid businessId format");
      }
      if (input.userId && !mongoose.Types.ObjectId.isValid(input.userId)) {
        throw new Error("Invalid userId format");
      }

      const engagement = new EngagementModel({
        eventId: new mongoose.Types.ObjectId(input.eventId),
        businessId: new mongoose.Types.ObjectId(input.businessId),
        userId: input.userId
          ? new mongoose.Types.ObjectId(input.userId)
          : undefined,
        actionType: input.actionType,
        source: input.source || EngagementSource.APP,
        sessionId: input.sessionId,
        deviceType: input.deviceType,
        referrer: input.referrer,
        metadata: input.metadata,
        location: input.location,
      });

      await engagement.save();

      logger.info(
        {
          eventId: input.eventId,
          businessId: input.businessId,
          userId: input.userId,
          actionType: input.actionType,
        },
        "Engagement tracked successfully"
      );

      return engagement;
    } catch (error: any) {
      logger.error(
        { input, error: error.message },
        "Failed to track engagement"
      );
      throw error;
    }
  }

  /**
   * Track multiple engagements in batch
   */
  async trackBatch(
    input: BatchTrackInput
  ): Promise<{ inserted: number; errors: number }> {
    try {
      const docs = input.engagements.map((eng) => ({
        eventId: new mongoose.Types.ObjectId(eng.eventId),
        businessId: new mongoose.Types.ObjectId(eng.businessId),
        userId: eng.userId
          ? new mongoose.Types.ObjectId(eng.userId)
          : undefined,
        actionType: eng.actionType,
        source: eng.source || EngagementSource.APP,
        sessionId: eng.sessionId,
        deviceType: eng.deviceType,
        referrer: eng.referrer,
        metadata: eng.metadata,
        location: eng.location,
      }));

      const result = await EngagementModel.insertMany(docs, { ordered: false });

      logger.info(
        { count: result.length },
        "Batch engagements tracked successfully"
      );

      return {
        inserted: result.length,
        errors: input.engagements.length - result.length,
      };
    } catch (error: any) {
      // Handle partial insert errors
      if (error.insertedDocs) {
        logger.warn(
          {
            inserted: error.insertedDocs.length,
            errors: input.engagements.length - error.insertedDocs.length,
          },
          "Batch engagement partially completed"
        );
        return {
          inserted: error.insertedDocs.length,
          errors: input.engagements.length - error.insertedDocs.length,
        };
      }

      logger.error({ error: error.message }, "Failed to track batch engagement");
      throw error;
    }
  }

  /**
   * Get engagement summary for an event
   */
  async getEventSummary(eventId: string): Promise<IEngagementSummary> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid eventId format");
    }

    return EngagementModel.getEventSummary(eventId);
  }

  /**
   * Get engagement summary for a business (all events)
   */
  async getBusinessSummary(
    businessId: string
  ): Promise<IEngagementSummary & { totalEvents: number }> {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error("Invalid businessId format");
    }

    return EngagementModel.getBusinessSummary(businessId);
  }

  /**
   * Get time-series engagement data for an event
   */
  async getEventTimeSeries(
    eventId: string,
    startDate: Date,
    endDate: Date,
    granularity: "hour" | "day" | "week" | "month" = "day"
  ): Promise<IEngagementTimeSeries[]> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid eventId format");
    }

    return EngagementModel.getEventTimeSeries(
      eventId,
      startDate,
      endDate,
      granularity
    );
  }

  /**
   * Get user's engagement status for an event
   */
  async getUserEventStatus(
    eventId: string,
    userId: string
  ): Promise<{
    hasLiked: boolean;
    hasSaved: boolean;
    hasRsvped: boolean;
    viewCount: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid eventId format");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId format");
    }

    return EngagementModel.getUserEventStatus(eventId, userId);
  }

  /**
   * List engagements with filtering and pagination
   */
  async listEngagements(query: ListEngagementsQuery): Promise<{
    items: IEngagement[];
    total: number;
    hasMore: boolean;
  }> {
    const { limit = 50, offset = 0 } = query;

    const filter: any = {};

    if (query.eventId) {
      if (!mongoose.Types.ObjectId.isValid(query.eventId)) {
        throw new Error("Invalid eventId format");
      }
      filter.eventId = new mongoose.Types.ObjectId(query.eventId);
    }

    if (query.businessId) {
      if (!mongoose.Types.ObjectId.isValid(query.businessId)) {
        throw new Error("Invalid businessId format");
      }
      filter.businessId = new mongoose.Types.ObjectId(query.businessId);
    }

    if (query.userId) {
      if (!mongoose.Types.ObjectId.isValid(query.userId)) {
        throw new Error("Invalid userId format");
      }
      filter.userId = new mongoose.Types.ObjectId(query.userId);
    }

    if (query.actionType) {
      filter.actionType = query.actionType;
    }

    if (query.source) {
      filter.source = query.source;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.createdAt.$lte = query.endDate;
      }
    }

    const [items, total] = await Promise.all([
      EngagementModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      EngagementModel.countDocuments(filter),
    ]);

    return {
      items: items as unknown as IEngagement[],
      total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Get top events by engagement for a business
   */
  async getTopEventsByEngagement(
    businessId: string,
    limit: number = 10,
    actionType?: EngagementActionType
  ): Promise<
    Array<{
      eventId: mongoose.Types.ObjectId;
      count: number;
    }>
  > {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error("Invalid businessId format");
    }

    const matchStage: any = {
      businessId: new mongoose.Types.ObjectId(businessId),
    };

    if (actionType) {
      matchStage.actionType = actionType;
    }

    const result = await EngagementModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$eventId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          eventId: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    return result;
  }

  /**
   * Get engagement breakdown by source for an event
   */
  async getEngagementBySource(
    eventId: string
  ): Promise<Array<{ source: string; count: number }>> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid eventId format");
    }

    const result = await EngagementModel.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          source: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    return result;
  }

  /**
   * Get engagement breakdown by device type for an event
   */
  async getEngagementByDevice(
    eventId: string
  ): Promise<Array<{ deviceType: string; count: number }>> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid eventId format");
    }

    const result = await EngagementModel.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: { $ifNull: ["$deviceType", "unknown"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          deviceType: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    return result;
  }

  /**
   * Delete engagements by event ID (for cleanup)
   */
  async deleteEventEngagements(eventId: string): Promise<{ deleted: number }> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid eventId format");
    }

    const result = await EngagementModel.deleteMany({
      eventId: new mongoose.Types.ObjectId(eventId),
    });

    logger.info(
      { eventId, deleted: result.deletedCount },
      "Event engagements deleted"
    );

    return { deleted: result.deletedCount };
  }

  /**
   * Get real-time engagement counts (last N minutes)
   */
  async getRealtimeEngagement(
    eventId: string,
    minutesAgo: number = 60
  ): Promise<{
    views: number;
    likes: number;
    shares: number;
    saves: number;
    totalEngagement: number;
  }> {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid eventId format");
    }

    const startTime = new Date(Date.now() - minutesAgo * 60 * 1000);

    const result = await EngagementModel.aggregate([
      {
        $match: {
          eventId: new mongoose.Types.ObjectId(eventId),
          createdAt: { $gte: startTime },
        },
      },
      {
        $group: {
          _id: null,
          views: { $sum: { $cond: [{ $eq: ["$actionType", "view"] }, 1, 0] } },
          likes: { $sum: { $cond: [{ $eq: ["$actionType", "like"] }, 1, 0] } },
          shares: { $sum: { $cond: [{ $eq: ["$actionType", "share"] }, 1, 0] } },
          saves: { $sum: { $cond: [{ $eq: ["$actionType", "save"] }, 1, 0] } },
          totalEngagement: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        views: 0,
        likes: 0,
        shares: 0,
        saves: 0,
        totalEngagement: 0,
      };
    }

    return {
      views: result[0].views,
      likes: result[0].likes,
      shares: result[0].shares,
      saves: result[0].saves,
      totalEngagement: result[0].totalEngagement,
    };
  }

  // ============================================================================
  // AI TRAINING ANALYTICS METHODS
  // ============================================================================

  /**
   * Get comprehensive engagement analytics for AI training
   * This provides insights that can be used to train the business AI assistant
   */
  async getAITrainingAnalytics(
    businessId: string,
    daysBack: number = 90
  ): Promise<{
    summary: {
      totalEvents: number;
      totalEngagements: number;
      averageEngagementRate: number;
      topPerformingEventTypes: string[];
    };
    peakEngagementTimes: {
      busiestDays: Array<{ day: string; count: number }>;
      busiestHours: Array<{ hour: number; count: number }>;
      quietPeriods: Array<{ day: string; hour: number; count: number }>;
    };
    audienceInsights: {
      deviceBreakdown: Array<{ device: string; percentage: number }>;
      sourceBreakdown: Array<{ source: string; percentage: number }>;
      topLocations: Array<{ city: string; count: number }>;
    };
    contentPerformance: {
      mostLikedEvents: Array<{ eventId: string; likes: number }>;
      mostSharedEvents: Array<{ eventId: string; shares: number }>;
      mostSavedEvents: Array<{ eventId: string; saves: number }>;
      highestEngagementRateEvents: Array<{ eventId: string; rate: number }>;
    };
    trends: {
      weeklyGrowth: number;
      monthlyGrowth: number;
      engagementTrend: "increasing" | "stable" | "decreasing";
    };
  }> {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error("Invalid businessId format");
    }

    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
    const businessObjId = new mongoose.Types.ObjectId(businessId);

    // Get overall summary
    const summaryResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalEngagements: { $sum: 1 },
          uniqueEvents: { $addToSet: "$eventId" },
          totalViews: {
            $sum: { $cond: [{ $eq: ["$actionType", "view"] }, 1, 0] },
          },
          totalLikes: {
            $sum: { $cond: [{ $eq: ["$actionType", "like"] }, 1, 0] },
          },
          totalShares: {
            $sum: { $cond: [{ $eq: ["$actionType", "share"] }, 1, 0] },
          },
          totalSaves: {
            $sum: { $cond: [{ $eq: ["$actionType", "save"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          totalEngagements: 1,
          totalEvents: { $size: "$uniqueEvents" },
          averageEngagementRate: {
            $cond: [
              { $gt: ["$totalViews", 0] },
              {
                $divide: [
                  { $add: ["$totalLikes", "$totalShares", "$totalSaves"] },
                  "$totalViews",
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    // Get busiest days of the week
    const busiestDaysResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const busiestDays = busiestDaysResult.map((d) => ({
      day: dayNames[d._id - 1],
      count: d.count,
    }));

    // Get busiest hours
    const busiestHoursResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const busiestHours = busiestHoursResult.map((h) => ({
      hour: h._id,
      count: h.count,
    }));

    // Get quiet periods (day + hour combinations with low engagement)
    const quietPeriodsResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: "$createdAt" },
            hour: { $hour: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: 1 } },
      { $limit: 5 },
    ]);

    const quietPeriods = quietPeriodsResult.map((q) => ({
      day: dayNames[q._id.day - 1],
      hour: q._id.hour,
      count: q.count,
    }));

    // Get device breakdown
    const deviceResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$deviceType", "unknown"] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalDeviceCount = deviceResult.reduce((sum, d) => sum + d.count, 0);
    const deviceBreakdown = deviceResult.map((d) => ({
      device: d._id,
      percentage: Math.round((d.count / totalDeviceCount) * 100),
    }));

    // Get source breakdown
    const sourceResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalSourceCount = sourceResult.reduce((sum, s) => sum + s.count, 0);
    const sourceBreakdown = sourceResult.map((s) => ({
      source: s._id,
      percentage: Math.round((s.count / totalSourceCount) * 100),
    }));

    // Get top locations
    const locationResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          createdAt: { $gte: startDate },
          "location.city": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$location.city",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const topLocations = locationResult.map((l) => ({
      city: l._id,
      count: l.count,
    }));

    // Get most liked events
    const mostLikedResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          actionType: "like",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$eventId",
          likes: { $sum: 1 },
        },
      },
      { $sort: { likes: -1 } },
      { $limit: 5 },
    ]);

    const mostLikedEvents = mostLikedResult.map((e) => ({
      eventId: e._id.toString(),
      likes: e.likes,
    }));

    // Get most shared events
    const mostSharedResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          actionType: "share",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$eventId",
          shares: { $sum: 1 },
        },
      },
      { $sort: { shares: -1 } },
      { $limit: 5 },
    ]);

    const mostSharedEvents = mostSharedResult.map((e) => ({
      eventId: e._id.toString(),
      shares: e.shares,
    }));

    // Get most saved events
    const mostSavedResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          actionType: "save",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$eventId",
          saves: { $sum: 1 },
        },
      },
      { $sort: { saves: -1 } },
      { $limit: 5 },
    ]);

    const mostSavedEvents = mostSavedResult.map((e) => ({
      eventId: e._id.toString(),
      saves: e.saves,
    }));

    // Get highest engagement rate events
    const engagementRateResult = await EngagementModel.aggregate([
      {
        $match: {
          businessId: businessObjId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$eventId",
          views: { $sum: { $cond: [{ $eq: ["$actionType", "view"] }, 1, 0] } },
          engagements: {
            $sum: {
              $cond: [
                {
                  $in: ["$actionType", ["like", "share", "save", "rsvp"]],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $match: { views: { $gte: 10 } }, // Only events with at least 10 views
      },
      {
        $project: {
          eventId: "$_id",
          rate: { $divide: ["$engagements", "$views"] },
        },
      },
      { $sort: { rate: -1 } },
      { $limit: 5 },
    ]);

    const highestEngagementRateEvents = engagementRateResult.map((e) => ({
      eventId: e._id.toString(),
      rate: Math.round(e.rate * 100) / 100,
    }));

    // Calculate growth trends
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [thisWeek, lastWeek, thisMonth, lastMonth] = await Promise.all([
      EngagementModel.countDocuments({
        businessId: businessObjId,
        createdAt: { $gte: oneWeekAgo },
      }),
      EngagementModel.countDocuments({
        businessId: businessObjId,
        createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
      }),
      EngagementModel.countDocuments({
        businessId: businessObjId,
        createdAt: { $gte: oneMonthAgo },
      }),
      EngagementModel.countDocuments({
        businessId: businessObjId,
        createdAt: { $gte: twoMonthsAgo, $lt: oneMonthAgo },
      }),
    ]);

    const weeklyGrowth =
      lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
    const monthlyGrowth =
      lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : 0;

    let engagementTrend: "increasing" | "stable" | "decreasing" = "stable";
    if (weeklyGrowth > 10) {
      engagementTrend = "increasing";
    } else if (weeklyGrowth < -10) {
      engagementTrend = "decreasing";
    }

    return {
      summary: {
        totalEvents: summaryResult[0]?.totalEvents || 0,
        totalEngagements: summaryResult[0]?.totalEngagements || 0,
        averageEngagementRate:
          Math.round((summaryResult[0]?.averageEngagementRate || 0) * 100) / 100,
        topPerformingEventTypes: [], // Would need event type data from backend
      },
      peakEngagementTimes: {
        busiestDays,
        busiestHours,
        quietPeriods,
      },
      audienceInsights: {
        deviceBreakdown,
        sourceBreakdown,
        topLocations,
      },
      contentPerformance: {
        mostLikedEvents,
        mostSharedEvents,
        mostSavedEvents,
        highestEngagementRateEvents,
      },
      trends: {
        weeklyGrowth,
        monthlyGrowth,
        engagementTrend,
      },
    };
  }

  /**
   * Generate AI training insights text from engagement analytics
   * This creates formatted text that can be added to AI assistant instructions
   */
  async generateAITrainingInsights(businessId: string): Promise<string> {
    const analytics = await this.getAITrainingAnalytics(businessId);

    const formatHour = (hour: number): string => {
      if (hour === 0) return "12 AM";
      if (hour === 12) return "12 PM";
      return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
    };

    let insights = `
## Engagement Analytics Insights (Last 90 Days)

### Overall Performance
- Total Events: ${analytics.summary.totalEvents}
- Total Engagements: ${analytics.summary.totalEngagements}
- Average Engagement Rate: ${(analytics.summary.averageEngagementRate * 100).toFixed(1)}%
- Engagement Trend: ${analytics.trends.engagementTrend}
- Weekly Growth: ${analytics.trends.weeklyGrowth > 0 ? "+" : ""}${analytics.trends.weeklyGrowth}%
- Monthly Growth: ${analytics.trends.monthlyGrowth > 0 ? "+" : ""}${analytics.trends.monthlyGrowth}%

### Peak Engagement Times
`;

    if (analytics.peakEngagementTimes.busiestDays.length > 0) {
      const topDays = analytics.peakEngagementTimes.busiestDays
        .slice(0, 3)
        .map((d) => d.day);
      insights += `- Busiest Days: ${topDays.join(", ")}\n`;
    }

    if (analytics.peakEngagementTimes.busiestHours.length > 0) {
      const topHours = analytics.peakEngagementTimes.busiestHours
        .slice(0, 3)
        .map((h) => formatHour(h.hour));
      insights += `- Peak Hours: ${topHours.join(", ")}\n`;
    }

    if (analytics.peakEngagementTimes.quietPeriods.length > 0) {
      const quietTimes = analytics.peakEngagementTimes.quietPeriods
        .slice(0, 3)
        .map((q) => `${q.day} ${formatHour(q.hour)}`);
      insights += `- Slow Periods (opportunity for promotions): ${quietTimes.join(", ")}\n`;
    }

    insights += `
### Audience Insights
`;

    if (analytics.audienceInsights.deviceBreakdown.length > 0) {
      const devices = analytics.audienceInsights.deviceBreakdown
        .map((d) => `${d.device} (${d.percentage}%)`)
        .join(", ");
      insights += `- Device Usage: ${devices}\n`;
    }

    if (analytics.audienceInsights.sourceBreakdown.length > 0) {
      const sources = analytics.audienceInsights.sourceBreakdown
        .map((s) => `${s.source} (${s.percentage}%)`)
        .join(", ");
      insights += `- Traffic Sources: ${sources}\n`;
    }

    if (analytics.audienceInsights.topLocations.length > 0) {
      const locations = analytics.audienceInsights.topLocations
        .slice(0, 5)
        .map((l) => l.city);
      insights += `- Top Locations: ${locations.join(", ")}\n`;
    }

    insights += `
### Content Performance Insights
- Events with highest engagement rates indicate content that resonates well with the audience
- Focus on replicating successful content patterns
`;

    if (analytics.contentPerformance.highestEngagementRateEvents.length > 0) {
      insights += `- Top engagement rate: ${(analytics.contentPerformance.highestEngagementRateEvents[0].rate * 100).toFixed(1)}%\n`;
    }

    insights += `
### Recommendations Based on Data
1. Schedule promotions during slow periods to boost traffic
2. Post content during peak hours (${analytics.peakEngagementTimes.busiestHours.slice(0, 2).map((h) => formatHour(h.hour)).join(" and ")})
3. Optimize for ${analytics.audienceInsights.deviceBreakdown[0]?.device || "mobile"} users
4. Focus marketing efforts on ${analytics.audienceInsights.sourceBreakdown[0]?.source || "app"} channel
`;

    return insights;
  }

  /**
   * Get engagement patterns for specific user segments
   */
  async getUserSegmentAnalytics(
    businessId: string,
    segmentBy: "device" | "source" | "location"
  ): Promise<
    Array<{
      segment: string;
      totalEngagements: number;
      engagementBreakdown: {
        views: number;
        likes: number;
        shares: number;
        saves: number;
      };
      engagementRate: number;
    }>
  > {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error("Invalid businessId format");
    }

    const groupField =
      segmentBy === "device"
        ? { $ifNull: ["$deviceType", "unknown"] }
        : segmentBy === "source"
          ? "$source"
          : "$location.city";

    const result = await EngagementModel.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
        },
      },
      {
        $group: {
          _id: groupField,
          totalEngagements: { $sum: 1 },
          views: { $sum: { $cond: [{ $eq: ["$actionType", "view"] }, 1, 0] } },
          likes: { $sum: { $cond: [{ $eq: ["$actionType", "like"] }, 1, 0] } },
          shares: { $sum: { $cond: [{ $eq: ["$actionType", "share"] }, 1, 0] } },
          saves: { $sum: { $cond: [{ $eq: ["$actionType", "save"] }, 1, 0] } },
        },
      },
      {
        $project: {
          segment: "$_id",
          totalEngagements: 1,
          engagementBreakdown: {
            views: "$views",
            likes: "$likes",
            shares: "$shares",
            saves: "$saves",
          },
          engagementRate: {
            $cond: [
              { $gt: ["$views", 0] },
              {
                $divide: [
                  { $add: ["$likes", "$shares", "$saves"] },
                  "$views",
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { totalEngagements: -1 } },
    ]);

    return result.map((r) => ({
      segment: r.segment || "unknown",
      totalEngagements: r.totalEngagements,
      engagementBreakdown: r.engagementBreakdown,
      engagementRate: Math.round(r.engagementRate * 100) / 100,
    }));
  }
}

export const engagementService = new EngagementService();
