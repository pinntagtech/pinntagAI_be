import { Router } from "express";
import {
  generateTemplate,
  generateMultipleTemplates,
  getTemplates,
  getTemplateById,
  triggerTemplateUpdate,
  generateForAllBusinesses,
  generateGenericForIndustry,
  triggerScheduledJob,
  getSchedulerStatus,
} from "../controllers/templateController.js";

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
 * @route   GET /api/templates
 * @desc    Get all active templates (with optional filters)
 * @access  Public
 * @query   type?, scope?, businessId?, industryId?
 * @examples
 *   GET /api/templates - Get all templates
 *   GET /api/templates?scope=generic - Get only generic templates
 *   GET /api/templates?scope=generic&industryId=123 - Generic templates for industry
 *   GET /api/templates?businessId=456 - All templates for business (generic + business-specific)
 *   GET /api/templates?scope=business_specific&businessId=456 - Only business-specific
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
 * @body    { jobName: "template-update" }
 */
router.post("/trigger-scheduled-job", triggerScheduledJob);

/**
 * @route   GET /api/templates/scheduler-status
 * @desc    Get status of all scheduled jobs
 * @access  Public (should be protected in production)
 */
router.get("/scheduler-status", getSchedulerStatus);

export default router;
