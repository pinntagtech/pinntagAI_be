import mongoose from "mongoose";
import { getBackendBusinessModel } from "../../models/pinntagBackend/business.model.js";
import { getUserFootprintModel } from "../../models/pinntagBackend/userFootprint.model.js";
import { getBackendConnection } from "../../db/connection.js";
import { AI_TrainingModel } from "../../models/AI_Training.model.js";
import { logger } from "../../utils/logger.js";

export type FootprintIntensity = "low" | "moderate" | "high" | "critical";

export type RecommendationOccasion =
  | "low_views"
  | "low_conversion"
  | "lapsed_likers"
  | "lapsed_followers"
  | "nearby_passersby"
  | "midweek_dip"
  | "cold_window"
  | "weekend_boost"
  | "evergreen_slow_period";

export interface FootprintSnapshot {
  windowDays: number;
  totalBusinessViews: number;
  totalEventViews: number;
  uniqueVisitors: number;
  nearbyVisitors: number;
  totalLikes: number;
  totalShares: number;
  totalSaves: number;
  totalRsvps: number;
  totalCheckIns: number;
  newFollowers: number;
  netFollowers: number;
  engagementRate: number;
  baselineBusinessViews: number;
  viewsDeltaPct: number;
  intensity: FootprintIntensity;
  signals: RecommendationOccasion[];
}

export interface SlowTimeTemplate {
  occasion: RecommendationOccasion;
  intensity: FootprintIntensity;
  type: "flashdeal" | "offer" | "spotlight" | "business_event" | "social_event";
  contentType: "offer" | "broadcast" | "reward" | "event";
  title: string;
  description: string;
  callToAction: string;
  termsAndConditions: string;
  discountType?: string;
  suggestedDiscountValue?: string;
  bestTiming?: { days?: string[]; hours?: string[]; seasonalNote?: string };
  rationale: string;
}

export interface SlowTimeRecommendations {
  isSlowTime: boolean;
  footprint: FootprintSnapshot;
  primaryTemplate: SlowTimeTemplate | null;
  alternativeTemplates: SlowTimeTemplate[];
}

const TEMPLATE_LIBRARY: Record<
  RecommendationOccasion,
  Omit<SlowTimeTemplate, "intensity">
> = {
  low_views: {
    occasion: "low_views",
    type: "flashdeal",
    contentType: "offer",
    title: "2-Hour Window: 20% Off Everything",
    description:
      "Pop in for the next two hours and save 20% on anything in the shop. No code, no minimum — just walk in and we'll take care of the rest.",
    callToAction: "Grab it now",
    termsAndConditions:
      "Valid today only during the listed window. Walk-in / dine-in only. Cannot be combined with other offers.",
    discountType: "% Off",
    suggestedDiscountValue: "20",
    bestTiming: { hours: ["12:00", "14:00"] },
    rationale:
      "Views are below baseline — a tight, high-urgency window pulls passers-by who would otherwise scroll past.",
  },
  low_conversion: {
    occasion: "low_conversion",
    type: "offer",
    contentType: "offer",
    title: "You've Been Eyeing Us — $5 Off Your First Visit",
    description:
      "We've noticed you've been checking us out. Here's $5 off your first order to help you make up your mind. Quick, easy, no commitment.",
    callToAction: "Claim $5 off",
    termsAndConditions:
      "First-time customers only. One per person. Expires in 7 days.",
    discountType: "$ Off",
    suggestedDiscountValue: "5",
    bestTiming: { days: ["Thursday", "Friday"] },
    rationale:
      "Plenty of views, few conversions — a small first-visit incentive turns lookers into customers.",
  },
  lapsed_likers: {
    occasion: "lapsed_likers",
    type: "spotlight",
    contentType: "reward",
    title: "A Little Something, On the House",
    description:
      "Stop by this week and a free treat is waiting for you with any purchase. Our way of saying thanks for remembering us.",
    callToAction: "Redeem this week",
    termsAndConditions:
      "Valid for 7 days. Show this post at checkout. One per customer.",
    discountType: "Free Item",
    bestTiming: { days: ["Tuesday", "Wednesday", "Thursday"] },
    rationale:
      "People liked or saved you a while ago without coming back. A small free item brings them through the door.",
  },
  midweek_dip: {
    occasion: "midweek_dip",
    type: "offer",
    contentType: "offer",
    title: "Tuesday = 15% Off, Always",
    description:
      "Every Tuesday, take 15% off your entire order. Same place, quieter vibe, smaller bill. Make it your new midweek thing.",
    callToAction: "See you Tuesday",
    termsAndConditions:
      "Tuesdays only. In-store only. Excludes alcohol and prior purchases.",
    discountType: "% Off",
    suggestedDiscountValue: "15",
    bestTiming: { days: ["Tuesday"] },
    rationale:
      "Midweek is consistently softer than weekends — a recurring weekday discount builds a habit, not a one-off.",
  },
  cold_window: {
    occasion: "cold_window",
    type: "business_event",
    contentType: "event",
    title: "Happy Hour, Reimagined — 4 to 6 PM Daily",
    description:
      "Every weekday, 4–6 PM: 30% off drinks and a free snack with any order. No cover, no reservation, just come.",
    callToAction: "Drop in",
    termsAndConditions:
      "Weekdays 4–6 PM. In-house only. While supplies last.",
    discountType: "Happy Hour",
    suggestedDiscountValue: "30",
    bestTiming: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], hours: ["16:00", "18:00"] },
    rationale:
      "Multiple metrics are down at once — a recurring daily anchor restores predictable footfall.",
  },
  weekend_boost: {
    occasion: "weekend_boost",
    type: "flashdeal",
    contentType: "offer",
    title: "Bring a Friend, Second One's on Us",
    description:
      "Buy one, get one free this weekend when you bring someone new. The best deals travel by word-of-mouth.",
    callToAction: "Tag a friend",
    termsAndConditions:
      "Both guests must be present. Equal or lesser value free. Valid this weekend only.",
    discountType: "BOGO",
    bestTiming: { days: ["Saturday", "Sunday"] },
    rationale:
      "Saves and shares are flat — a BOGO turns one customer into two without cutting the headline price.",
  },
  lapsed_followers: {
    occasion: "lapsed_followers",
    type: "spotlight",
    contentType: "broadcast",
    title: "Hey Followers — We've Got a Surprise",
    description:
      "Thanks for following along. Stop in this week and mention this post for a thank-you discount on us. Our way of bringing the crew back together.",
    callToAction: "Show this post",
    termsAndConditions:
      "Followers only. Show this post at checkout. Valid for 7 days. One per person.",
    discountType: "% Off",
    suggestedDiscountValue: "15",
    rationale:
      "You have followers but they're not converting into visits. A followers-only perk re-activates a warm audience.",
  },
  nearby_passersby: {
    occasion: "nearby_passersby",
    type: "flashdeal",
    contentType: "offer",
    title: "You're Right Around the Corner — 25% Off, Today Only",
    description:
      "Spotted you nearby. Swing by today and we'll knock 25% off your order. No code needed, just walk in.",
    callToAction: "Stop in today",
    termsAndConditions:
      "Valid today only. In-store only. One use per customer.",
    discountType: "% Off",
    suggestedDiscountValue: "25",
    bestTiming: { hours: ["11:00", "14:00"] },
    rationale:
      "Plenty of nearby app users but few are walking in — a same-day, location-aware nudge converts proximity into footfall.",
  },
  evergreen_slow_period: {
    occasion: "evergreen_slow_period",
    type: "offer",
    contentType: "offer",
    title: "Quiet Hours, Loud Savings",
    description:
      "During our slower stretch, take 10% off anything on the menu. Beat the crowd, same great experience.",
    callToAction: "Plan a visit",
    termsAndConditions:
      "Valid only during the business's posted slow hours. In-store only.",
    discountType: "% Off",
    suggestedDiscountValue: "10",
    rationale:
      "Default suggestion when footprint data is sparse — fills the configured slow-time window with a low-risk offer.",
  },
};

const WINDOW_DAYS = 7;
const BASELINE_DAYS = 28;
const NEARBY_RADIUS_METERS = 1000;

interface WindowedSummary {
  totalBusinessViews: number;
  totalEventViews: number;
  uniqueVisitors: number;
  nearbyVisitors: number;
  totalLikes: number;
  totalShares: number;
  totalSaves: number;
  totalRsvps: number;
  totalCheckIns: number;
  newFollowers: number;
  netFollowers: number;
}

const EMPTY_SUMMARY: WindowedSummary = {
  totalBusinessViews: 0,
  totalEventViews: 0,
  uniqueVisitors: 0,
  nearbyVisitors: 0,
  totalLikes: 0,
  totalShares: 0,
  totalSaves: 0,
  totalRsvps: 0,
  totalCheckIns: 0,
  newFollowers: 0,
  netFollowers: 0,
};

async function getWindowedSummary(
  businessId: string,
  windowDays: number,
  eventIds: mongoose.Types.ObjectId[],
  businessLocation: { lat: number; lng: number } | null,
): Promise<WindowedSummary> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const businessObjectId = new mongoose.Types.ObjectId(businessId);

  const backendConn = await getBackendConnection();
  const FootprintModel = getUserFootprintModel(backendConn);

  const targetMatch: any = {
    createdAt: { $gte: since },
    $or: [
      { targetType: "BUSINESS", targetId: businessObjectId },
    ],
  };
  if (eventIds.length > 0) {
    targetMatch.$or.push({ targetType: "EVENT", targetId: { $in: eventIds } });
  }

  const [aggResult] = await FootprintModel.aggregate([
    { $match: targetMatch },
    {
      $facet: {
        actionCounts: [
          {
            $group: {
              _id: "$action",
              count: { $sum: 1 },
              uniqueUsers: { $addToSet: "$user" },
            },
          },
        ],
        uniqueVisitors: [
          { $group: { _id: "$user" } },
          { $count: "n" },
        ],
        nearbyVisitors: businessLocation
          ? [
              {
                $match: {
                  latitude: { $ne: null },
                  longitude: { $ne: null },
                },
              },
              {
                $addFields: {
                  distM: {
                    $multiply: [
                      111320,
                      {
                        $sqrt: {
                          $add: [
                            {
                              $pow: [
                                { $subtract: ["$latitude", businessLocation.lat] },
                                2,
                              ],
                            },
                            {
                              $pow: [
                                {
                                  $subtract: [
                                    "$longitude",
                                    businessLocation.lng,
                                  ],
                                },
                                2,
                              ],
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
              { $match: { distM: { $lte: NEARBY_RADIUS_METERS } } },
              { $group: { _id: "$user" } },
              { $count: "n" },
            ]
          : [{ $limit: 0 }],
      },
    },
  ]);

  const counts = new Map<string, { count: number; uniqueUsers: number }>();
  for (const row of aggResult?.actionCounts ?? []) {
    counts.set(row._id, {
      count: row.count,
      uniqueUsers: (row.uniqueUsers ?? []).length,
    });
  }

  const get = (action: string) => counts.get(action)?.count ?? 0;

  const follows = get("FOLLOW");
  const unfollows = get("UNFOLLOW");

  return {
    totalBusinessViews: get("BUSINESS_VIEW"),
    totalEventViews: get("EVENT_VIEW"),
    uniqueVisitors: aggResult?.uniqueVisitors?.[0]?.n ?? 0,
    nearbyVisitors: aggResult?.nearbyVisitors?.[0]?.n ?? 0,
    totalLikes: Math.max(0, get("EVENT_LIKE") - get("EVENT_UNLIKE")),
    totalShares: get("EVENT_SHARE"),
    totalSaves: Math.max(0, get("EVENT_SAVE") - get("EVENT_UNSAVE")),
    totalRsvps: Math.max(0, get("EVENT_RSVP") - get("EVENT_CANCEL_RSVP")),
    totalCheckIns: get("CHECK_IN"),
    newFollowers: follows,
    netFollowers: follows - unfollows,
  };
}

function projectBaseline(value: number): number {
  return (value / BASELINE_DAYS) * WINDOW_DAYS;
}

function classifyIntensity(
  recentViews: number,
  baselineViews: number,
): FootprintIntensity {
  if (baselineViews <= 0) return "low";
  const projectedBaseline = projectBaseline(baselineViews);
  if (projectedBaseline <= 0) return "low";
  const ratio = recentViews / projectedBaseline;
  if (ratio < 0.4) return "critical";
  if (ratio < 0.7) return "high";
  if (ratio < 0.9) return "moderate";
  return "low";
}

interface TrainingContext {
  slowPeriods: string[]; // e.g. ["Weekday afternoons", "Mid-week"]
  busiestDays: string[]; // e.g. ["Friday", "Saturday", "Sunday"]
  trainingComplete: boolean;
}

const MIN_BASELINE_VIEWS = 5; // Below this, projection-based signals are noise

function isMidweekNow(now = new Date()): boolean {
  const day = now.getDay(); // 0=Sun ... 6=Sat
  return day >= 2 && day <= 4; // Tue, Wed, Thu
}

function isWeekdayAfternoonNow(now = new Date()): boolean {
  const day = now.getDay();
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 12 && hour < 17;
}

function trainingSaysSlowNow(slowPeriods: string[], now = new Date()): boolean {
  if (!slowPeriods || slowPeriods.length === 0) return false;
  const normalized = slowPeriods.map((s) => s.toLowerCase());
  if (normalized.some((s) => s.includes("mid-week") || s === "midweek")) {
    if (isMidweekNow(now)) return true;
  }
  if (normalized.some((s) => s.includes("weekday afternoon"))) {
    if (isWeekdayAfternoonNow(now)) return true;
  }
  return false;
}

function detectSignals(
  recent: WindowedSummary,
  baseline: WindowedSummary,
  hasSlowTimeConfigured: boolean,
  training: TrainingContext,
): RecommendationOccasion[] {
  const signals: RecommendationOccasion[] = [];
  const projectedBaselineViews = projectBaseline(baseline.totalBusinessViews);
  const viewsDelta =
    projectedBaselineViews > 0
      ? (recent.totalBusinessViews - projectedBaselineViews) /
        projectedBaselineViews
      : 0;
  const baselineSignificant = baseline.totalBusinessViews >= MIN_BASELINE_VIEWS;

  // Categorical "slow now" signal — fires when the business itself told us
  // this time of week is slow. Doesn't depend on baseline math.
  if (training.slowPeriods.some((p) => /mid-week/i.test(p)) && isMidweekNow()) {
    signals.push("midweek_dip");
  }

  if (baselineSignificant && viewsDelta < -0.3) signals.push("low_views");

  // Conversion: views → check-ins or RSVPs
  const totalViews = recent.totalBusinessViews + recent.totalEventViews;
  const conversionRate =
    totalViews > 0
      ? (recent.totalCheckIns + recent.totalRsvps) / totalViews
      : 0;
  if (totalViews >= 50 && conversionRate < 0.05) {
    signals.push("low_conversion");
  }

  // Nearby people are seeing the business but not following or checking in
  if (
    recent.nearbyVisitors >= 20 &&
    recent.totalCheckIns + recent.newFollowers < recent.nearbyVisitors * 0.1
  ) {
    signals.push("nearby_passersby");
  }

  const projectedBaselineLikes = projectBaseline(baseline.totalLikes);
  if (
    projectedBaselineLikes > 5 &&
    recent.totalLikes < projectedBaselineLikes * 0.4
  ) {
    signals.push("lapsed_likers");
  }

  // Followers exist but visit/check-in cadence has dropped
  if (
    baseline.netFollowers >= 10 &&
    recent.totalCheckIns + recent.totalRsvps <
      Math.max(2, projectBaseline(baseline.totalCheckIns + baseline.totalRsvps) * 0.4)
  ) {
    signals.push("lapsed_followers");
  }

  const projectedBaselineSaves = projectBaseline(baseline.totalSaves);
  const projectedBaselineShares = projectBaseline(baseline.totalShares);
  if (
    projectedBaselineSaves + projectedBaselineShares > 4 &&
    recent.totalSaves + recent.totalShares <
      (projectedBaselineSaves + projectedBaselineShares) * 0.5
  ) {
    signals.push("weekend_boost");
  }

  const downCount = [
    baselineSignificant && viewsDelta < -0.3,
    recent.totalLikes < projectedBaselineLikes * 0.5,
    recent.totalSaves < projectedBaselineSaves * 0.5,
    recent.totalRsvps < projectBaseline(baseline.totalRsvps) * 0.5,
    recent.newFollowers < projectBaseline(baseline.newFollowers) * 0.5,
  ].filter(Boolean).length;
  if (downCount >= 3 && baselineSignificant) signals.push("cold_window");

  // Final fallback for completed-training businesses: if the business has any
  // slow-time signal configured (clock window OR training answer) but no
  // anomaly fired, suggest the evergreen template anyway.
  const evergreenAvailable =
    hasSlowTimeConfigured ||
    training.slowPeriods.length > 0 ||
    trainingSaysSlowNow(training.slowPeriods);
  if (signals.length === 0 && evergreenAvailable) {
    signals.push("evergreen_slow_period");
  }

  return signals;
}

function buildTemplate(
  occasion: RecommendationOccasion,
  intensity: FootprintIntensity,
): SlowTimeTemplate {
  const base = TEMPLATE_LIBRARY[occasion];
  return { ...base, intensity };
}

export class SlowTimeRecommendationService {
  static async getRecommendations(
    businessId: string,
  ): Promise<SlowTimeRecommendations> {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error("Invalid businessId format");
    }

    let hasSlowTimeConfigured = false;
    let businessLocation: { lat: number; lng: number } | null = null;
    let eventIds: mongoose.Types.ObjectId[] = [];

    try {
      const backendConn = await getBackendConnection();
      const BusinessModel = getBackendBusinessModel(backendConn);
      const business = await BusinessModel.findById(businessId)
        .select("slowTime latitude longitude")
        .lean();
      hasSlowTimeConfigured = !!(business as any)?.slowTime?.startTime;
      const lat = (business as any)?.latitude;
      const lng = (business as any)?.longitude;
      if (typeof lat === "number" && typeof lng === "number") {
        businessLocation = { lat, lng };
      }

      // Look up event IDs that belong to this business — needed to attribute
      // EVENT_* footprints (likes, RSVPs, etc.) back to the business.
      const EventCollection = backendConn.collection("events");
      const events = await EventCollection.find(
        { businessProfile: new mongoose.Types.ObjectId(businessId) },
        { projection: { _id: 1 } },
      )
        .limit(500)
        .toArray();
      eventIds = events.map((e) => e._id as mongoose.Types.ObjectId);
    } catch (err) {
      logger.warn(
        { businessId, err: (err as Error).message },
        "Could not read business context for slow-time recs",
      );
    }

    // Pull training-side categorical answers (slow_periods, busiest_days).
    // These are richer than the clock-hour `business.slowTime` field for
    // recommendation purposes.
    const training: TrainingContext = {
      slowPeriods: [],
      busiestDays: [],
      trainingComplete: false,
    };
    try {
      const trainingDoc = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      })
        .select("trainingStatus responses")
        .lean();
      training.trainingComplete = trainingDoc?.trainingStatus === "completed";
      const responses = (trainingDoc?.responses ?? []) as Array<{
        questionId: string;
        answer: any;
      }>;
      const sp = responses.find((r) => r.questionId === "slow_periods")?.answer;
      const bd = responses.find((r) => r.questionId === "busiest_days")?.answer;
      training.slowPeriods = Array.isArray(sp) ? (sp as string[]) : [];
      training.busiestDays = Array.isArray(bd) ? (bd as string[]) : [];
    } catch (err) {
      logger.warn(
        { businessId, err: (err as Error).message },
        "Could not read training context for slow-time recs",
      );
    }

    const [recent, baseline] = await Promise.all([
      getWindowedSummary(businessId, WINDOW_DAYS, eventIds, businessLocation).catch(
        (err) => {
          logger.warn(
            { businessId, err: err?.message },
            "Failed to fetch recent footprint window",
          );
          return EMPTY_SUMMARY;
        },
      ),
      getWindowedSummary(businessId, BASELINE_DAYS, eventIds, businessLocation).catch(
        (err) => {
          logger.warn(
            { businessId, err: err?.message },
            "Failed to fetch baseline footprint window",
          );
          return EMPTY_SUMMARY;
        },
      ),
    ]);

    const projectedBaselineViews = projectBaseline(baseline.totalBusinessViews);
    const viewsDeltaPct =
      projectedBaselineViews > 0
        ? ((recent.totalBusinessViews - projectedBaselineViews) /
            projectedBaselineViews) *
          100
        : 0;
    const intensity = classifyIntensity(
      recent.totalBusinessViews,
      baseline.totalBusinessViews,
    );
    const signals = detectSignals(
      recent,
      baseline,
      hasSlowTimeConfigured,
      training,
    );

    const interactedViews =
      recent.totalBusinessViews + recent.totalEventViews;
    const engagementRate =
      interactedViews > 0
        ? (recent.totalLikes +
            recent.totalShares +
            recent.totalSaves +
            recent.totalRsvps +
            recent.totalCheckIns) /
          interactedViews
        : 0;

    const footprint: FootprintSnapshot = {
      windowDays: WINDOW_DAYS,
      totalBusinessViews: recent.totalBusinessViews,
      totalEventViews: recent.totalEventViews,
      uniqueVisitors: recent.uniqueVisitors,
      nearbyVisitors: recent.nearbyVisitors,
      totalLikes: recent.totalLikes,
      totalShares: recent.totalShares,
      totalSaves: recent.totalSaves,
      totalRsvps: recent.totalRsvps,
      totalCheckIns: recent.totalCheckIns,
      newFollowers: recent.newFollowers,
      netFollowers: recent.netFollowers,
      engagementRate: Number(engagementRate.toFixed(4)),
      baselineBusinessViews: baseline.totalBusinessViews,
      viewsDeltaPct: Number(viewsDeltaPct.toFixed(1)),
      intensity,
      signals,
    };

    const isSlowTime =
      signals.length > 0 || intensity === "high" || intensity === "critical";

    // When training is complete we always hand back a template — the
    // caller (training-state API, cron job) wants something ready to post.
    // Footprint.signals still tells them whether this is a real anomaly
    // or just the evergreen fallback.
    const ordered: RecommendationOccasion[] =
      signals.length > 0 ? signals : ["evergreen_slow_period"];
    const primary =
      training.trainingComplete || isSlowTime
        ? buildTemplate(ordered[0], intensity)
        : null;
    const alternatives =
      training.trainingComplete || isSlowTime
        ? ordered.slice(1).map((occ) => buildTemplate(occ, intensity))
        : [];

    return {
      isSlowTime,
      footprint,
      primaryTemplate: primary,
      alternativeTemplates: alternatives,
    };
  }
}
