import { Router } from "express";
import { consumerAIController } from "../controllers/consumerAIController.js";
import { internalApiKeyGuard } from "../../middleware/auth.js";

const router = Router();

/**
 * Consumer AI Routes
 * Base path: /consumer-ai
 *
 * These endpoints provide AI-powered chat and recommendations for consumers.
 * Uses chat completions with cross-chat referencing for personalized experiences.
 */

// Apply internal API key guard to all routes
router.use(internalApiKeyGuard);

// ============================================================================
// CHAT ENDPOINTS
// ============================================================================

/**
 * @route   POST /consumer-ai/chat
 * @desc    Send a message to the consumer AI and get a response
 * @access  Internal (Pinntag Backend)
 * @body    {
 *            userId: string,          // Required - Consumer user ObjectId
 *            message: string,         // Required - User's message (max 2000 chars)
 *            sessionId?: string,      // Optional - Conversation session ID (auto-generated if not provided)
 *            location?: {             // Optional - User's current location
 *              city?: string,
 *              state?: string,
 *              coordinates?: { lat: number, lng: number }
 *            }
 *          }
 * @returns {
 *            sessionId: string,
 *            response: string,
 *            eventsRecommended?: Array<{ eventId, reason }>,
 *            suggestedFollowUps?: string[],
 *            metadata?: { tokensUsed, preferencesUpdated }
 *          }
 */
router.post("/chat", consumerAIController.chat);

// ============================================================================
// PROFILE & PREFERENCES ENDPOINTS
// ============================================================================

/**
 * @route   GET /consumer-ai/profile/:userId
 * @desc    Get user's AI profile including preferences, stats, and recent topics
 * @access  Internal (Pinntag Backend)
 */
router.get("/profile/:userId", consumerAIController.getProfile);

/**
 * @route   POST /consumer-ai/preferences/:userId/sync
 * @desc    Sync user preferences from their engagement data (views, likes, saves, etc.)
 * @access  Internal (Pinntag Backend)
 */
router.post("/preferences/:userId/sync", consumerAIController.syncPreferences);

/**
 * @route   POST /consumer-ai/preferences/:userId
 * @desc    Add an explicit user preference (interest or dislike)
 * @access  Internal (Pinntag Backend)
 * @body    {
 *            type: "interest" | "dislike",
 *            value: string
 *          }
 */
router.post("/preferences/:userId", consumerAIController.addPreference);

// ============================================================================
// CONVERSATION HISTORY ENDPOINTS
// ============================================================================

/**
 * @route   GET /consumer-ai/history/:userId
 * @desc    Get conversation history for a user
 * @access  Internal (Pinntag Backend)
 * @query   sessionId?: string (get specific session), limit?: number (default 10, max 100)
 */
router.get("/history/:userId", consumerAIController.getHistory);

/**
 * @route   DELETE /consumer-ai/history/:userId
 * @desc    Clear conversation history for privacy
 * @access  Internal (Pinntag Backend)
 * @query   sessionId?: string (clear specific session, or all if not provided)
 */
router.delete("/history/:userId", consumerAIController.clearHistory);

export { router as consumerAIRoutes };
