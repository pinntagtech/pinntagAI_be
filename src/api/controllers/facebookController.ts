import { Request, Response } from "express";
import { FacebookService } from "../services/faceboook.service.js";
import { logger } from "../../utils/logger.js";

const facebookService = new FacebookService();

export class FacebookController {
  /**
   * Handle Facebook OAuth callback and exchange code for access token
   * GET /facebook/oauth/callback
   * Query params: { code: string, state: string }
   */
  async handleOAuthCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;

      // Validate required parameters
      if (!code || typeof code !== "string") {
        return res.status(400).json({
          success: false,
          error: "Authorization code is required",
        });
      }

      if (!state || typeof state !== "string") {
        return res.status(400).json({
          success: false,
          error: "State parameter is required for CSRF protection",
        });
      }

      // TODO: Verify state parameter against stored session value
      // For now, we'll log it for the developer to implement
      logger.info(
        { state },
        "IMPORTANT: Verify this state matches your stored session value"
      );

      // Get redirect URI from environment variable
      const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
      if (!redirectUri) {
        return res.status(500).json({
          success: false,
          error: "FACEBOOK_REDIRECT_URI not configured in environment",
        });
      }

      logger.info(
        { codeLength: code.length, state },
        "Processing Facebook OAuth callback"
      );

      // Exchange code for access token
      const result = await facebookService.exchangeCodeForToken(code, redirectUri);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.data || "Failed to exchange code for access token",
        });
      }

      logger.info(
        { tokenType: result.data.token_type, expiresIn: result.data.expires_in },
        "Successfully exchanged code for access token"
      );

      return res.status(200).json({
        success: true,
        data: {
          accessToken: result.data.access_token,
          tokenType: result.data.token_type,
          expiresIn: result.data.expires_in,
        },
      });
    } catch (error: any) {
      logger.error({ error: error.message }, "Error handling OAuth callback");
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Generate a long-lived token from a short-lived token
   * POST /facebook/token/long-lived
   * Body: { shortLivedToken: string }
   */
  async generateLongLivedToken(req: Request, res: Response) {
    try {
      const { shortLivedToken } = req.body;

      console.log(shortLivedToken, "In-controller");

      if (!shortLivedToken) {
        return res
          .status(400)
          .json({ success: false, error: "shortLivedToken is required" });
      }

      const result = await facebookService.fetchLongLivedToken(shortLivedToken);

      if (result.success) {
        return res.status(200).json({ success: true, data: result.data });
      } else {
        return res.status(400).json({ success: false, error: result.data });
      }
    } catch (error: any) {
      logger.error({ error }, "Error generating long-lived token");
      return res.status(500).json({ success: false, error: error.message });
    }
  }
  /**
   * GET /facebook/posts
   * Query params: { token: string, useAI?: boolean, minScore?: number }
   * Fetches all Facebook posts and filters those suitable for Pinntag
   * useAI: Use AI-based filtering (default: false)
   * minScore: Minimum AI confidence score (0-100, default: 60)
   */
  async getFacebookPosts(req: Request, res: Response) {
    try {
      const { token, useAI, minScore } = req.query;

      // Validate token
      if (!token || typeof token !== "string") {
        return res.status(400).json({
          success: false,
          error: "Facebook access token is required",
        });
      }

      // Parse optional parameters
      const useAIFiltering = useAI === "true" || useAI === "1";
      const minAIScore = minScore ? parseInt(minScore as string, 10) : 60;

      // Validate minScore
      if (isNaN(minAIScore) || minAIScore < 0 || minAIScore > 100) {
        return res.status(400).json({
          success: false,
          error: "minScore must be a number between 0 and 100",
        });
      }

      logger.info(
        { useAI: useAIFiltering, minScore: minAIScore },
        "Fetching Facebook posts for Pinntag filtering"
      );

      // Fetch and filter posts
      const result = await facebookService.getAllPostsForPinntag(
        token,
        useAIFiltering,
        minAIScore
      );

      if (!result.success || !result.data) {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch Facebook posts",
        });
      }

      logger.info(
        {
          total: result.data.total,
          filtered: result.data.filtered,
          filterMethod: result.data.filterMethod,
        },
        `Successfully fetched and filtered Facebook posts: ${result.data.filtered} out of ${result.data.total} posts are suitable for Pinntag`
      );

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      logger.error("Error in getFacebookPosts:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * POST /facebook/posts
   * Body: { token: string, useAI?: boolean, minScore?: number }
   * Alternative POST endpoint for fetching Facebook posts (in case token is sensitive)
   * useAI: Use AI-based filtering (default: false)
   * minScore: Minimum AI confidence score (0-100, default: 60)
   */
  async getFacebookPostsPost(req: Request, res: Response) {
    try {
      const { token, useAI, minScore } = req.body;

      // Validate token
      if (!token || typeof token !== "string") {
        return res.status(400).json({
          success: false,
          error: "Facebook access token is required",
        });
      }

      // Parse optional parameters
      const useAIFiltering =
        useAI === true || useAI === "true" || useAI === "1";
      const minAIScore = minScore ? parseInt(String(minScore), 10) : 60;

      // Validate minScore
      if (isNaN(minAIScore) || minAIScore < 0 || minAIScore > 100) {
        return res.status(400).json({
          success: false,
          error: "minScore must be a number between 0 and 100",
        });
      }

      logger.info(
        { useAI: useAIFiltering, minScore: minAIScore },
        "Fetching Facebook posts for Pinntag filtering (POST)"
      );

      // Fetch and filter posts
      const result = await facebookService.getAllPostsForPinntag(
        token,
        useAIFiltering,
        minAIScore
      );

      if (!result.success || !result.data) {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to fetch Facebook posts",
        });
      }

      logger.info(
        {
          total: result.data.total,
          filtered: result.data.filtered,
          filterMethod: result.data.filterMethod,
        },
        `Successfully fetched and filtered Facebook posts: ${result.data.filtered} out of ${result.data.total} posts are suitable for Pinntag`
      );

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      logger.error("Error in getFacebookPostsPost:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async getAllPosts(req: Request, res: Response) {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({
          success: false,
          error: "Facebook access token is required",
        });
      }

      const result = await facebookService.getAllPosts(token);
      if (result.success) {
        return res.status(200).json({ success: true, data: result.data });
      } else {
        return res.status(400).json({ success: false, error: result.data });
      }
    } catch (error: any) {
      logger.error({ error }, "Error fetching all Facebook posts");
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Fetch all Facebook posts and events, save to database, and return AI-filtered results
   * Uses the saved Facebook token from business_ai_assistant database
   * GET /facebook/page-data
   * Query: { businessId: string, useAI?: boolean, minScore?: number }
   */
  async fetchAndSavePageData(req: Request, res: Response) {
    try {
      const { businessId, useAI, minScore } = req.query;

      // Validate required parameters
      if (!businessId || typeof businessId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Business ID is required",
        });
      }

      // Parse optional parameters
      const useAIFiltering = useAI === "true" || useAI === "1";
      const minAIScore = minScore ? parseInt(minScore as string, 10) : 60;

      // Validate minScore
      if (isNaN(minAIScore) || minAIScore < 0 || minAIScore > 100) {
        return res.status(400).json({
          success: false,
          error: "minScore must be a number between 0 and 100",
        });
      }

      logger.info(
        { businessId, useAI: useAIFiltering, minScore: minAIScore },
        "Fetching and saving Facebook page data using saved token"
      );

      // Fetch, save, and filter data (token retrieved from database)
      const result = await facebookService.fetchAndSavePageData(
        businessId,
        useAIFiltering,
        minAIScore
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || "Failed to fetch and save Facebook data",
        });
      }

      logger.info(
        {
          businessId,
          summary: result.data?.summary,
        },
        "Successfully fetched, saved, and filtered Facebook page data"
      );

      return res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error: any) {
      logger.error({ error }, "Error in fetchAndSavePageData controller");
      return res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  /**
   * Generate Long-Lived Page Access Token from a short-lived page token
   * POST /facebook/token/page-access
   * Body: { pageAccessToken: string, businessId?: string, pageId?: string }
   */
  async generatePageAccessToken(req: Request, res: Response) {
    try {
      const { pageAccessToken, businessId, pageId } = req.body;

      if (!pageAccessToken) {
        return res.status(400).json({
          success: false,
          error: "pageAccessToken is required",
        });
      }

      logger.info(
        { hasBusinessId: !!businessId, hasPageId: !!pageId },
        "Generating long-lived page access token"
      );

      const result = await facebookService.generateLongLivedPageToken(
        pageAccessToken,
        businessId,
        pageId
      );

      if (result.success) {
        return res.status(200).json({ success: true, data: result.data });
      } else {
        return res.status(400).json({ success: false, error: result.data });
      }
    } catch (error: any) {
      logger.error({ error }, "Error generating long-lived page access token");
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const facebookController = new FacebookController();
