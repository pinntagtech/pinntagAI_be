import { Router } from "express";
import { internalApiKeyGuard } from "../../middleware/auth.js";
import { facebookController } from "../controllers/facebookController.js";

export const facebookRouter = Router();

// Expose Facebook features to Pinntag backend only
facebookRouter.use(internalApiKeyGuard);

/**
 * GET /facebook/posts
 * Query params: {
 *   token: string (required),
 *   useAI?: boolean (optional, default: false) - Use AI-based filtering,
 *   minScore?: number (optional, default: 60, range: 0-100) - Minimum AI confidence score
 * }
 * Fetches all Facebook posts and filters those suitable for Pinntag
 *
 * Filtering Methods:
 * - Rule-based (useAI=false): Fast filtering using predefined rules (media, engagement, content)
 * - AI-based (useAI=true): Intelligent filtering using Gemini AI to analyze post suitability
 *
 * Returns: {
 *   success: boolean,
 *   data: {
 *     total: number,
 *     filtered: number,
 *     filterMethod: "rules" | "ai",
 *     posts: Array<FacebookPost & { aiAnalysis?: { suitable, reason, score, category } }>
 *   }
 * }
 *
 * Examples:
 * - GET /facebook/posts?token=xxx (rule-based filtering)
 * - GET /facebook/posts?token=xxx&useAI=true (AI filtering with default 60 score)
 * - GET /facebook/posts?token=xxx&useAI=true&minScore=80 (AI filtering with 80 minimum score)
 */
facebookRouter.get("/posts", facebookController.getFacebookPosts);

/**
 * POST /facebook/posts
 * Body: {
 *   token: string (required),
 *   useAI?: boolean (optional, default: false) - Use AI-based filtering,
 *   minScore?: number (optional, default: 60, range: 0-100) - Minimum AI confidence score
 * }
 * Alternative POST endpoint for fetching Facebook posts (for sensitive tokens)
 *
 * Filtering Methods:
 * - Rule-based (useAI=false): Fast filtering using predefined rules
 * - AI-based (useAI=true): Intelligent filtering using Gemini AI
 *
 * Returns: {
 *   success: boolean,
 *   data: {
 *     total: number,
 *     filtered: number,
 *     filterMethod: "rules" | "ai",
 *     posts: Array<FacebookPost & { aiAnalysis?: { suitable, reason, score, category } }>
 *   }
 * }
 */
facebookRouter.post("/posts", facebookController.getFacebookPostsPost);

export { facebookRouter as facebookRoutes };
