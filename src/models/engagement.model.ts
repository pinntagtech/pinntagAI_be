import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Engagement action types that can be tracked
 */
export enum EngagementActionType {
  VIEW = "view",
  LIKE = "like",
  UNLIKE = "unlike",
  SHARE = "share",
  SAVE = "save",
  UNSAVE = "unsave",
  CLICK = "click",
  RSVP = "rsvp",
  CANCEL_RSVP = "cancel_rsvp",
}

/**
 * Source/platform where the engagement occurred
 */
export enum EngagementSource {
  APP = "app",
  WEB = "web",
  EMBED = "embed",
  API = "api",
}

/**
 * Interface for individual engagement record
 */
export interface IEngagement extends Document {
  // Core identifiers
  eventId: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Consumer who performed the action (optional for anonymous views)

  // Action details
  actionType: EngagementActionType;
  source: EngagementSource;

  // Additional context
  sessionId?: string; // For tracking anonymous users
  deviceType?: string; // mobile, desktop, tablet
  referrer?: string; // Where the user came from
  metadata?: Record<string, any>; // Additional custom data

  // Location context (optional)
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  ipAddress?: string; // IP address of the user
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for engagement aggregation results
 */
export interface IEngagementSummary {
  eventId: mongoose.Types.ObjectId;
  totalViews: number;
  uniqueViews: number;
  totalLikes: number;
  totalShares: number;
  totalSaves: number;
  totalClicks: number;
  totalRsvps: number;
  engagementRate: number; // (likes + shares + saves + rsvps) / views
}

/**
 * Interface for time-series engagement data
 */
export interface IEngagementTimeSeries {
  date: Date;
  views: number;
  likes: number;
  shares: number;
  saves: number;
  clicks: number;
  rsvps: number;
}

// Location sub-schema
const LocationSchema = new Schema(
  {
    city: { type: String },
    state: { type: String },
    country: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

// Main Engagement Schema
const EngagementSchema = new Schema<IEngagement>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "Event",
    },
    businessId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "Business",
    },
    userId: {
      type: Schema.Types.ObjectId,
      index: true,
      ref: "User",
    },
    actionType: {
      type: String,
      required: true,
      enum: Object.values(EngagementActionType),
      index: true,
    },
    source: {
      type: String,
      required: true,
      enum: Object.values(EngagementSource),
      default: EngagementSource.APP,
    },
    sessionId: {
      type: String,
      index: true,
    },
    deviceType: {
      type: String,
      enum: ["mobile", "desktop", "tablet", "unknown"],
    },
    ipAddress: {
      type: String,
    },
    referrer: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    location: LocationSchema,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for common queries
EngagementSchema.index({ eventId: 1, actionType: 1 });
EngagementSchema.index({ businessId: 1, actionType: 1 });
EngagementSchema.index({ eventId: 1, createdAt: -1 });
EngagementSchema.index({ businessId: 1, createdAt: -1 });
EngagementSchema.index({ userId: 1, eventId: 1, actionType: 1 });
EngagementSchema.index({ createdAt: -1 }); // For time-based queries

// Index for unique view counting
EngagementSchema.index(
  { eventId: 1, userId: 1, actionType: 1 },
  { sparse: true }
);

// Index for session-based unique views (anonymous users)
EngagementSchema.index(
  { eventId: 1, sessionId: 1, actionType: 1 },
  { sparse: true }
);

/**
 * Static method: Get engagement summary for an event
 */
EngagementSchema.statics.getEventSummary = async function (
  eventId: mongoose.Types.ObjectId | string
): Promise<IEngagementSummary> {
  const result = await this.aggregate([
    { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: "$eventId",
        totalViews: {
          $sum: { $cond: [{ $eq: ["$actionType", "view"] }, 1, 0] },
        },
        uniqueUserIds: {
          $addToSet: {
            $cond: [
              { $and: [{ $eq: ["$actionType", "view"] }, "$userId"] },
              "$userId",
              "$$REMOVE",
            ],
          },
        },
        uniqueSessionIds: {
          $addToSet: {
            $cond: [
              {
                $and: [
                  { $eq: ["$actionType", "view"] },
                  { $not: "$userId" },
                  "$sessionId",
                ],
              },
              "$sessionId",
              "$$REMOVE",
            ],
          },
        },
        totalLikes: {
          $sum: { $cond: [{ $eq: ["$actionType", "like"] }, 1, 0] },
        },
        totalUnlikes: {
          $sum: { $cond: [{ $eq: ["$actionType", "unlike"] }, 1, 0] },
        },
        totalShares: {
          $sum: { $cond: [{ $eq: ["$actionType", "share"] }, 1, 0] },
        },
        totalSaves: {
          $sum: { $cond: [{ $eq: ["$actionType", "save"] }, 1, 0] },
        },
        totalUnsaves: {
          $sum: { $cond: [{ $eq: ["$actionType", "unsave"] }, 1, 0] },
        },
        totalClicks: {
          $sum: { $cond: [{ $eq: ["$actionType", "click"] }, 1, 0] },
        },
        totalRsvps: {
          $sum: { $cond: [{ $eq: ["$actionType", "rsvp"] }, 1, 0] },
        },
        totalCancelRsvps: {
          $sum: { $cond: [{ $eq: ["$actionType", "cancel_rsvp"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        eventId: "$_id",
        totalViews: 1,
        uniqueViews: {
          $add: [{ $size: "$uniqueUserIds" }, { $size: "$uniqueSessionIds" }],
        },
        totalLikes: { $subtract: ["$totalLikes", "$totalUnlikes"] },
        totalShares: 1,
        totalSaves: { $subtract: ["$totalSaves", "$totalUnsaves"] },
        totalClicks: 1,
        totalRsvps: { $subtract: ["$totalRsvps", "$totalCancelRsvps"] },
        engagementRate: {
          $cond: [
            { $gt: ["$totalViews", 0] },
            {
              $divide: [
                {
                  $add: [
                    { $subtract: ["$totalLikes", "$totalUnlikes"] },
                    "$totalShares",
                    { $subtract: ["$totalSaves", "$totalUnsaves"] },
                    { $subtract: ["$totalRsvps", "$totalCancelRsvps"] },
                  ],
                },
                "$totalViews",
              ],
            },
            0,
          ],
        },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      eventId: new mongoose.Types.ObjectId(eventId),
      totalViews: 0,
      uniqueViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalSaves: 0,
      totalClicks: 0,
      totalRsvps: 0,
      engagementRate: 0,
    };
  }

  return result[0];
};

/**
 * Static method: Get engagement summary for a business (all events)
 */
EngagementSchema.statics.getBusinessSummary = async function (
  businessId: mongoose.Types.ObjectId | string
): Promise<IEngagementSummary & { totalEvents: number }> {
  const result = await this.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
    {
      $group: {
        _id: "$businessId",
        totalEvents: { $addToSet: "$eventId" },
        totalViews: {
          $sum: { $cond: [{ $eq: ["$actionType", "view"] }, 1, 0] },
        },
        uniqueUserIds: {
          $addToSet: {
            $cond: [
              { $and: [{ $eq: ["$actionType", "view"] }, "$userId"] },
              "$userId",
              "$$REMOVE",
            ],
          },
        },
        totalLikes: {
          $sum: { $cond: [{ $eq: ["$actionType", "like"] }, 1, 0] },
        },
        totalUnlikes: {
          $sum: { $cond: [{ $eq: ["$actionType", "unlike"] }, 1, 0] },
        },
        totalShares: {
          $sum: { $cond: [{ $eq: ["$actionType", "share"] }, 1, 0] },
        },
        totalSaves: {
          $sum: { $cond: [{ $eq: ["$actionType", "save"] }, 1, 0] },
        },
        totalUnsaves: {
          $sum: { $cond: [{ $eq: ["$actionType", "unsave"] }, 1, 0] },
        },
        totalClicks: {
          $sum: { $cond: [{ $eq: ["$actionType", "click"] }, 1, 0] },
        },
        totalRsvps: {
          $sum: { $cond: [{ $eq: ["$actionType", "rsvp"] }, 1, 0] },
        },
        totalCancelRsvps: {
          $sum: { $cond: [{ $eq: ["$actionType", "cancel_rsvp"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        eventId: "$_id",
        totalEvents: { $size: "$totalEvents" },
        totalViews: 1,
        uniqueViews: { $size: "$uniqueUserIds" },
        totalLikes: { $subtract: ["$totalLikes", "$totalUnlikes"] },
        totalShares: 1,
        totalSaves: { $subtract: ["$totalSaves", "$totalUnsaves"] },
        totalClicks: 1,
        totalRsvps: { $subtract: ["$totalRsvps", "$totalCancelRsvps"] },
        engagementRate: {
          $cond: [
            { $gt: ["$totalViews", 0] },
            {
              $divide: [
                {
                  $add: [
                    { $subtract: ["$totalLikes", "$totalUnlikes"] },
                    "$totalShares",
                    { $subtract: ["$totalSaves", "$totalUnsaves"] },
                    { $subtract: ["$totalRsvps", "$totalCancelRsvps"] },
                  ],
                },
                "$totalViews",
              ],
            },
            0,
          ],
        },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      eventId: new mongoose.Types.ObjectId(businessId),
      totalEvents: 0,
      totalViews: 0,
      uniqueViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalSaves: 0,
      totalClicks: 0,
      totalRsvps: 0,
      engagementRate: 0,
    };
  }

  return result[0];
};

/**
 * Static method: Get time-series engagement data for an event
 */
EngagementSchema.statics.getEventTimeSeries = async function (
  eventId: mongoose.Types.ObjectId | string,
  startDate: Date,
  endDate: Date,
  granularity: "hour" | "day" | "week" | "month" = "day"
): Promise<IEngagementTimeSeries[]> {
  const dateFormat = {
    hour: { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } },
    day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
    week: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } },
    month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
  };

  return this.aggregate([
    {
      $match: {
        eventId: new mongoose.Types.ObjectId(eventId),
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: dateFormat[granularity],
        views: { $sum: { $cond: [{ $eq: ["$actionType", "view"] }, 1, 0] } },
        likes: { $sum: { $cond: [{ $eq: ["$actionType", "like"] }, 1, 0] } },
        shares: { $sum: { $cond: [{ $eq: ["$actionType", "share"] }, 1, 0] } },
        saves: { $sum: { $cond: [{ $eq: ["$actionType", "save"] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ["$actionType", "click"] }, 1, 0] } },
        rsvps: { $sum: { $cond: [{ $eq: ["$actionType", "rsvp"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: "$_id",
        views: 1,
        likes: 1,
        shares: 1,
        saves: 1,
        clicks: 1,
        rsvps: 1,
        _id: 0,
      },
    },
  ]);
};

/**
 * Static method: Check if user has performed an action on event
 */
EngagementSchema.statics.hasUserAction = async function (
  eventId: mongoose.Types.ObjectId | string,
  userId: mongoose.Types.ObjectId | string,
  actionType: EngagementActionType
): Promise<boolean> {
  const count = await this.countDocuments({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
    actionType,
  });
  return count > 0;
};

/**
 * Static method: Get user's engagement status for an event
 */
EngagementSchema.statics.getUserEventStatus = async function (
  eventId: mongoose.Types.ObjectId | string,
  userId: mongoose.Types.ObjectId | string
): Promise<{
  hasLiked: boolean;
  hasSaved: boolean;
  hasRsvped: boolean;
  viewCount: number;
}> {
  const engagements = await this.find({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean();

  let likeCount = 0;
  let saveCount = 0;
  let rsvpCount = 0;
  let viewCount = 0;

  for (const eng of engagements) {
    switch (eng.actionType) {
      case EngagementActionType.LIKE:
        likeCount++;
        break;
      case EngagementActionType.UNLIKE:
        likeCount--;
        break;
      case EngagementActionType.SAVE:
        saveCount++;
        break;
      case EngagementActionType.UNSAVE:
        saveCount--;
        break;
      case EngagementActionType.RSVP:
        rsvpCount++;
        break;
      case EngagementActionType.CANCEL_RSVP:
        rsvpCount--;
        break;
      case EngagementActionType.VIEW:
        viewCount++;
        break;
    }
  }

  return {
    hasLiked: likeCount > 0,
    hasSaved: saveCount > 0,
    hasRsvped: rsvpCount > 0,
    viewCount,
  };
};

// Extend the Model interface with static methods
interface EngagementModel extends Model<IEngagement> {
  getEventSummary(
    eventId: mongoose.Types.ObjectId | string
  ): Promise<IEngagementSummary>;
  getBusinessSummary(
    businessId: mongoose.Types.ObjectId | string
  ): Promise<IEngagementSummary & { totalEvents: number }>;
  getEventTimeSeries(
    eventId: mongoose.Types.ObjectId | string,
    startDate: Date,
    endDate: Date,
    granularity?: "hour" | "day" | "week" | "month"
  ): Promise<IEngagementTimeSeries[]>;
  hasUserAction(
    eventId: mongoose.Types.ObjectId | string,
    userId: mongoose.Types.ObjectId | string,
    actionType: EngagementActionType
  ): Promise<boolean>;
  getUserEventStatus(
    eventId: mongoose.Types.ObjectId | string,
    userId: mongoose.Types.ObjectId | string
  ): Promise<{
    hasLiked: boolean;
    hasSaved: boolean;
    hasRsvped: boolean;
    viewCount: number;
  }>;
}

export const EngagementModel = mongoose.model<IEngagement, EngagementModel>(
  "Engagement",
  EngagementSchema
);
