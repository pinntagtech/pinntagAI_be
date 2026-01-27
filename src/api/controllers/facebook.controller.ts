import { Request, Response } from "express";
import { FacebookService } from "../services/faceboook.service.js";
import { logger } from "../../utils/logger.js";

const fbService = new FacebookService();

/**
 * Get the Facebook Login URL
 * GET /api/facebook/login-url?redirectUri=...
 */
export const getFacebookLoginUrl = (req: Request, res: Response) => {
  try {
    const redirectUri = req.query.redirectUri as string;
    if (!redirectUri) {
      return res
        .status(400)
        .json({ success: false, error: "redirectUri is required" });
    }
    const url = fbService.getLoginUrl(redirectUri);
    return res.json({ success: true, url });
  } catch (error: any) {
    logger.error({ error }, "Error generating login URL");
    return res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Exchange authorization code for short-lived token
 * POST /api/facebook/token
 * Body: { code: string, redirectUri: string }
 */
export const generateShortLivedToken = async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({
        success: false,
        error: "Authorization code and redirectUri are required",
      });
    }

    const result = await fbService.exchangeCodeForToken(code, redirectUri);

    if (result.success) {
      return res.status(200).json({ success: true, data: result.data });
    } else {
      return res.status(400).json({ success: false, error: result.data });
    }
  } catch (error: any) {
    logger.error({ error }, "Error generating short-lived token");
    return res.status(400).json({ success: false, error: error.message });
  }
};
