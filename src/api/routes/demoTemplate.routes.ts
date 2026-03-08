import { Router } from "express";
import {
  generateDemoTemplates,
  generateDemoTemplatesAsync,
} from "../controllers/demoTemplateController.js";

const router = Router();

/**
 * @route   POST /api/demo-templates/generate
 * @desc    Generate 20 demo templates for a business (synchronous - waits for completion)
 * @access  Public (should be protected in production)
 * @body    { businessId: string }
 * @details
 *   - Bypasses agent training requirement
 *   - Generates AI titles without discount values in title text
 *   - Generates AI images via Gemini for each template
 *   - Minimum 20% discount value enforced
 *   - Tags generated based on business category
 *   - Returns all 20 templates when complete (may take several minutes)
 */
router.post("/generate", generateDemoTemplates);

/**
 * @route   POST /api/demo-templates/generate-async
 * @desc    Generate 20 demo templates in the background (returns immediately)
 * @access  Public (should be protected in production)
 * @body    { businessId: string }
 * @details
 *   - Same as /generate but returns 202 immediately
 *   - Templates are generated in the background
 *   - Use GET /api/templates?businessId=xxx to check results
 */
router.post("/generate-async", generateDemoTemplatesAsync);

export default router;
