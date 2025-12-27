import { Request, Response } from "express";
import { FacebookService } from "../services/faceboook.service.js";
import { logger } from "../../utils/logger.js";

const facebookService = new FacebookService();

export class FacebookController {
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
   * Generate Long-Lived Page Access Token from a short-lived page token
   * POST /facebook/token/page-access
   * Body: { pageAccessToken: string }
   */
  async generatePageAccessToken(req: Request, res: Response) {
    try {
      const { pageAccessToken } = req.body;

      if (!pageAccessToken) {
        return res.status(400).json({
          success: false,
          error: "pageAccessToken is required",
        });
      }

      logger.info("Generating long-lived page access token");

      const result = await facebookService.generateLongLivedPageToken(
        pageAccessToken
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
