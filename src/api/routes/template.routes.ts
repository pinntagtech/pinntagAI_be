import { Router } from "express";
import {
  generateForAllBusinesses,
  generateForAllAgents,
  generateGenericForIndustry,
  generateMultipleTemplates,
  generateTemplate,
  generateTemplatesOnDemand,
  getSchedulerStatus,
  getTemplateById,
  getTemplates,
  triggerDailyTemplate,
  triggerScheduledJob,
  triggerTemplateUpdate,
} from "../controllers/templateController.js";
import { internalApiKeyGuard } from "../../middleware/auth.js";

const router = Router();

/**
 * @route   POST /api/templates/generate
 * @desc    Generate a single deal template for a business
 * @access  Public
 * @body    { businessId, occasion?, specificHoliday?, scope?, saveToDatabase? }
 */
router.post("/generate", generateTemplate);

/**
 * @route   POST /api/templates/generate-multiple
 * @desc    Generate multiple templates for a business
 * @access  Public
 * @body    { businessId, occasions: [{ occasion, specificHoliday?, scope? }] }
 */
router.post("/generate-multiple", generateMultipleTemplates);

/**
 * @route   POST /api/templates/generate-on-demand
 * @desc    On-demand AI template generation for a single business.
 *          Generates `count` templates (default 10, max 20) with AI images.
 *          Trained agents get business-specific templates; untrained agents
 *          get metadata-based templates. Returns saved templates synchronously.
 * @access  Internal (requires x-internal-api-key)
 * @body    { businessId: string (required), count?: number (default 10, max 20) }
 */
router.post("/generate-on-demand", internalApiKeyGuard, generateTemplatesOnDemand);

/**
 * @route   GET /api/templates
 * @desc    Get all active templates (with optional filters)
 * @access  Public
 * @query   type?, scope?, businessId?, industryId?, categoryId?, categoryIds?
 * @examples
 *   GET /api/templates - Get all templates
 *   GET /api/templates?scope=generic - Get only generic templates
 *   GET /api/templates?scope=generic&industryId=123 - Generic templates for industry
 *   GET /api/templates?businessId=456 - All templates for business (generic + business-specific)
 *   GET /api/templates?scope=business_specific&businessId=456 - Only business-specific
 *   GET /api/templates?industryId=123 - Templates for specific industry (from industryList API)
 *   GET /api/templates?categoryId=456 - Templates for specific subcategory (from businessCategoryList API)
 *   GET /api/templates?industryId=123&categoryId=456 - Templates for industry and subcategory
 *   GET /api/templates?industryId=123&categoryIds=456,789 - Templates for industry and multiple subcategories
 */
router.get("/", getTemplates);

/**
 * @route   GET /api/templates/:id
 * @desc    Get a specific template by ID
 * @access  Public
 */
router.get("/:id", getTemplateById);

/**
 * @route   POST /api/templates/update-all
 * @desc    Manually trigger overnight template update job
 * @access  Public (should be protected in production)
 */
router.post("/update-all", triggerTemplateUpdate);

/**
 * @route   POST /api/templates/generate-for-all-businesses
 * @desc    Generate templates for all trained businesses (both generic and business-specific)
 * @access  Public (should be protected in production)
 */
router.post("/generate-for-all-businesses", generateForAllBusinesses);

/**
 * @route   POST /api/templates/generate-for-all-agents
 * @desc    Generate templates for ALL AI agents (trained and untrained) with AI-generated images
 * @access  Public (should be protected in production)
 * @details
 *   - For trained agents: Uses training data to generate business-specific templates
 *   - For untrained agents: Uses agent metadata (category, subcategories, tags, description) to generate templates
 *   - All templates include AI-generated images with GENERIC content
 */
router.post("/generate-for-all-agents", generateForAllAgents);

/**
 * @route   POST /api/templates/generate-generic-for-industry
 * @desc    Generate generic templates for a specific industry
 * @access  Public (should be protected in production)
 * @body    { industryId, occasions? }
 */
router.post("/generate-generic-for-industry", generateGenericForIndustry);

/**
 * @route   POST /api/templates/trigger-scheduled-job
 * @desc    Manually trigger a scheduled job on demand (for testing)
 * @access  Public (should be protected in production)
 * @body    { jobName: "template-update" | "daily-template" | "agent-template-generation", dayOfWeek?: 0-6 }
 */
router.post("/trigger-scheduled-job", triggerScheduledJob);

/**
 * @route   POST /api/templates/trigger-daily-template
 * @desc    Trigger daily themed template generation for a specific day
 * @access  Public (should be protected in production)
 * @body    { dayOfWeek?: 0-6 } (0=Sunday, 5=Friday, etc. Defaults to today)
 * @examples
 *   POST /api/templates/trigger-daily-template - Generate today's themed templates
 *   POST /api/templates/trigger-daily-template { "dayOfWeek": 5 } - Generate Friday Deals & Offers
 */
router.post("/trigger-daily-template", triggerDailyTemplate);

/**
 * @route   GET /api/templates/scheduler-status
 * @desc    Get status of all scheduled jobs
 * @access  Public (should be protected in production)
 */
router.get("/scheduler-status", getSchedulerStatus);

export default router;
