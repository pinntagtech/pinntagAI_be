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
 * @desc Generate Long-Lived Page Access Token from short-lived page token
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

export { router as facebookRoutes };
