import { Router } from "express";
import { engagementController } from "../controllers/engagementController.js";
import { internalApiKeyGuard } from "../../middleware/auth.js";

const router = Router();

/**
 * Engagement Tracking Routes
 * Base path: /engagement
 *
 * These endpoints are called by the Pinntag backend to register
 * user engagement actions (views, likes, shares, etc.) on events.
 */

// Apply internal API key guard to all routes
// This ensures only the Pinntag backend can call these endpoints
router.use(internalApiKeyGuard);

// ============================================================================
// TRACKING ENDPOINTS
// ============================================================================

/**
 * @route   POST /engagement/track
 * @desc    Track a single engagement action
 * @access  Internal (Pinntag Backend)
 * @body    {
 *            eventId: string,       // Required - Event ObjectId
 *            businessId: string,    // Required - Business ObjectId
 *            userId?: string,       // Optional - User ObjectId (for logged-in users)
 *            actionType: string,    // Required - "view" | "like" | "unlike" | "share" | "save" | "unsave" | "click" | "rsvp" | "cancel_rsvp"
 *            source?: string,       // Optional - "app" | "web" | "embed" | "api"
 *            sessionId?: string,    // Optional - For tracking anonymous users
 *            deviceType?: string,   // Optional - "mobile" | "desktop" | "tablet"
 *            referrer?: string,     // Optional - Source URL
 *            metadata?: object,     // Optional - Additional custom data
 *            location?: {           // Optional - Location context
 *              city?: string,
 *              state?: string,
 *              country?: string,
 *              coordinates?: { lat: number, lng: number }
 *            }
 *          }
 */
router.post("/track", engagementController.trackEngagement);

/**
 * @route   POST /engagement/track/batch
 * @desc    Track multiple engagements in batch (max 1000)
 * @access  Internal (Pinntag Backend)
 * @body    {
 *            engagements: Array<TrackEngagementInput>
 *          }
 */
router.post("/track/batch", engagementController.trackBatch);

// ============================================================================
// EVENT ANALYTICS ENDPOINTS
// ============================================================================

/**
 * @route   GET /engagement/event/:eventId/summary
 * @desc    Get engagement summary for an event (views, likes, shares, etc.)
 * @access  Internal (Pinntag Backend)
 */
router.get("/event/:eventId/summary", engagementController.getEventSummary);

/**
 * @route   GET /engagement/event/:eventId/timeseries
 * @desc    Get time-series engagement data for an event
 * @access  Internal (Pinntag Backend)
 * @query   startDate?: string (ISO 8601), endDate?: string (ISO 8601), granularity?: "hour" | "day" | "week" | "month"
 */
router.get(
  "/event/:eventId/timeseries",
  engagementController.getEventTimeSeries
);

/**
 * @route   GET /engagement/event/:eventId/by-source
 * @desc    Get engagement breakdown by source (app, web, embed) for an event
 * @access  Internal (Pinntag Backend)
 */
router.get(
  "/event/:eventId/by-source",
  engagementController.getEngagementBySource
);

/**
 * @route   GET /engagement/event/:eventId/by-device
 * @desc    Get engagement breakdown by device type for an event
 * @access  Internal (Pinntag Backend)
 */
router.get(
  "/event/:eventId/by-device",
  engagementController.getEngagementByDevice
);

/**
 * @route   GET /engagement/event/:eventId/realtime
 * @desc    Get real-time engagement counts for an event (last N minutes)
 * @access  Internal (Pinntag Backend)
 * @query   minutesAgo?: number (default 60, max 1440)
 */
router.get(
  "/event/:eventId/realtime",
  engagementController.getRealtimeEngagement
);

/**
 * @route   GET /engagement/event/:eventId/user/:userId/status
 * @desc    Get user's engagement status for an event (hasLiked, hasSaved, etc.)
 * @access  Internal (Pinntag Backend)
 */
router.get(
  "/event/:eventId/user/:userId/status",
  engagementController.getUserEventStatus
);

/**
 * @route   DELETE /engagement/event/:eventId
 * @desc    Delete all engagements for an event (admin cleanup)
 * @access  Internal (Pinntag Backend)
 */
router.delete("/event/:eventId", engagementController.deleteEventEngagements);

// ============================================================================
// BUSINESS ANALYTICS ENDPOINTS
// ============================================================================

/**
 * @route   GET /engagement/business/:businessId/summary
 * @desc    Get engagement summary for a business (all events combined)
 * @access  Internal (Pinntag Backend)
 */
router.get(
  "/business/:businessId/summary",
  engagementController.getBusinessSummary
);

/**
 * @route   GET /engagement/business/:businessId/top-events
 * @desc    Get top events by engagement for a business
 * @access  Internal (Pinntag Backend)
 * @query   limit?: number (default 10), actionType?: string
 */
router.get(
  "/business/:businessId/top-events",
  engagementController.getTopEventsByEngagement
);

// ============================================================================
// AI TRAINING ANALYTICS ENDPOINTS
// ============================================================================

/**
 * @route   GET /engagement/business/:businessId/ai-training-analytics
 * @desc    Get comprehensive engagement analytics for AI training
 * @access  Internal (Pinntag Backend)
 * @query   daysBack?: number (default 90, max 365)
 * @returns Detailed analytics including peak times, audience insights, content performance, and trends
 */
router.get(
  "/business/:businessId/ai-training-analytics",
  engagementController.getAITrainingAnalytics
);

/**
 * @route   GET /engagement/business/:businessId/ai-training-insights
 * @desc    Generate formatted AI training insights text that can be added to AI assistant instructions
 * @access  Internal (Pinntag Backend)
 * @returns Formatted markdown text with engagement insights for AI training
 */
router.get(
  "/business/:businessId/ai-training-insights",
  engagementController.getAITrainingInsights
);

/**
 * @route   GET /engagement/business/:businessId/segment-analytics
 * @desc    Get engagement analytics segmented by device, source, or location
 * @access  Internal (Pinntag Backend)
 * @query   segmentBy?: "device" | "source" | "location" (default "device")
 */
router.get(
  "/business/:businessId/segment-analytics",
  engagementController.getUserSegmentAnalytics
);

// ============================================================================
// LIST/QUERY ENDPOINTS
// ============================================================================

/**
 * @route   GET /engagement
 * @desc    List engagements with filtering and pagination
 * @access  Internal (Pinntag Backend)
 * @query   eventId?, businessId?, userId?, actionType?, source?, startDate?, endDate?, limit?, offset?
 */
router.get("/", engagementController.listEngagements);

export { router as engagementRoutes };
