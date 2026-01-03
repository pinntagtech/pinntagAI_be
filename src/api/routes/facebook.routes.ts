import { Router } from "express";
import {
  generateShortLivedToken,
  getFacebookLoginUrl,
} from "../controllers/facebook.controller.js";
import { facebookController } from "../controllers/facebookController.js";

const router = Router();

/**
 * @route GET /api/facebook/login-url
 * @desc Get the Facebook Login URL to start OAuth flow
 */
router.get("/login-url", getFacebookLoginUrl);

/**
 * @route GET /api/facebook/oauth/callback
 * @desc Handle Facebook OAuth callback - Complete flow:
 *       1. Decode JWT token to extract businessId from businessProfile
 *       2. Exchange code for short-lived token
 *       3. Exchange for long-lived token
 *       4. Get page access token and metadata
 *       5. Save to database
 *       6. Return page info
 * @headers { Authorization: Bearer <JWT> }
 * @query { code: string, state: string }
 */
router.get("/oauth/callback", facebookController.handleOAuthCallback.bind(facebookController));

/**
 * @route POST /api/facebook/token
 * @desc Exchange authorization code for short-lived user access token
 */
router.post("/token", generateShortLivedToken);

/**
 * @route POST /api/facebook/token/long-lived
 * @desc Generate a long-lived token from a short-lived token
 */
router.post("/token/long-lived", facebookController.generateLongLivedToken);

/**
 * @route POST /api/facebook/token/page-access
 * @desc Generate Long-Lived Page Access Token and save to business_ai_assistant database
 * @body { pageAccessToken: string, businessId?: string, pageId?: string }
 */
router.post("/token/page-access", facebookController.generatePageAccessToken);

/**
 * @route GET /api/facebook/posts
 * @desc Get Facebook posts (with optional AI filtering)
 */
router.get("/posts", facebookController.getFacebookPosts);

/**
 * @route POST /api/facebook/posts
 * @desc Get Facebook posts (POST alternative for security)
 */
router.post("/posts", facebookController.getFacebookPostsPost);

/**
 * @route GET /api/facebook/all-posts
 * @desc Get all Facebook posts
 */
router.get("/all-posts", facebookController.getAllPosts);

/**
 * @route GET /api/facebook/page-data
 * @desc Fetch all Facebook posts/events, save to database, and return AI-filtered results
 * @desc Uses saved Facebook token from business_ai_assistant database
 * @query { businessId: string, useAI?: boolean, minScore?: number }
 */
router.get("/page-data", facebookController.fetchAndSavePageData);

/**
 * @route GET /api/facebook/posts/paginated
 * @desc Get Facebook posts with pagination and filtering
 * @headers { Authorization: Bearer <JWT> }
 * @query {
 *   page?: number,
 *   limit?: number,
 *   type?: "event" | "offer" | "spotlight" | "flashlight",
 *   minScore?: number,
 *   status?: "pending" | "ignored" | "saved" | "imported"
 * }
 */
router.get("/posts/paginated", facebookController.getFacebookPostsPaginated.bind(facebookController));

/**
 * @route PUT /api/facebook/posts/:postId/type
 * @desc Update the type and/or status of a Facebook post
 * @headers { Authorization: Bearer <JWT> }
 * @body {
 *   type?: "event" | "offer" | "spotlight" | "flashlight",
 *   status?: "pending" | "ignored" | "saved" | "imported",
 *   ignoreReason?: "not_relevant" | "personal_casual" | "duplicate" | "other",
 *   ignoreNote?: string
 * }
 */
router.put("/posts/:postId/type", facebookController.updateFacebookPostType.bind(facebookController));

/**
 * @route POST /api/facebook/posts/bulk-import
 * @desc Bulk mark posts as imported when they are converted to Pinntag events
 * @headers { Authorization: Bearer <JWT> }
 * @body {
 *   postIds: string[]
 * }
 */
router.post("/posts/bulk-import", facebookController.markPostsAsImported.bind(facebookController));

export { router as facebookRoutes };
