import { Request, Response } from "express";
import { logger } from "../../utils/logger.js";
import { env } from "../../config/env.js";
import { DealTemplateGeneratorService } from "../services/dealTemplateGenerator.service.js";
import { TemplateUpdateJob } from "../../jobs/templateUpdateJob.js";
import { JobScheduler } from "../../jobs/scheduler.js";
import { AgentTemplateGenerationJob } from "../../jobs/agentTemplateGenerationJob.js";
import {
  findActiveTemplates,
  findTemplatesByType,
  findTemplatesByIndustry,
  findTemplatesByCategory,
  findTemplatesByIndustryAndCategories,
  findTemplateById,
  findGenericTemplates,
  findBusinessSpecificTemplates,
  findTemplatesForBusiness,
  TemplateType,
  TemplateScope,
} from "../../models/pinntagBackend/dealTemplate.model.js";

/**
 * Template Controller
 * Handles template generation and management endpoints
 */

/**
 * Generate a single deal template for a business
 * POST /api/templates/generate
 */
export const generateTemplate = async (req: Request, res: Response) => {
  try {
    const {
      businessId,
      occasion,
      specificHoliday,
      promotionalGoal,
      businessIndustryId,
      businessCategoryIds,
      categories,
      thumbnailUrl,
      saveToDatabase = true,
    } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: "businessId is required",
      });
    }

    logger.info({ businessId, occasion }, "Generating deal template");

    if (saveToDatabase) {
      const template = await DealTemplateGeneratorService.generateAndSaveDealTemplate(
        businessId,
        {
          occasion,
          specificHoliday,
          promotionalGoal,
          businessIndustryId,
          businessCategoryIds,
          categories,
          thumbnailUrl,
        }
      );

      return res.status(201).json({
        success: true,
        data: template,
      });
    } else {
      const template = await DealTemplateGeneratorService.generateDealTemplate(
        businessId,
        {
          occasion,
          specificHoliday,
          promotionalGoal,
        }
      );

      return res.status(200).json({
        success: true,
        data: template,
      });
    }
  } catch (error: any) {
    logger.error({ error }, "Error generating template");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to generate template",
    });
  }
};

/**
 * Generate multiple templates for a business
 * POST /api/templates/generate-multiple
 */
export const generateMultipleTemplates = async (req: Request, res: Response) => {
  try {
    const { businessId, occasions } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: "businessId is required",
      });
    }

    if (!occasions || !Array.isArray(occasions)) {
      return res.status(400).json({
        success: false,
        error: "occasions array is required",
      });
    }

    logger.info(
      { businessId, count: occasions.length },
      "Generating multiple templates"
    );

    const templates = await DealTemplateGeneratorService.generateAndSaveMultipleTemplates(
      businessId,
      occasions
    );

    return res.status(201).json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error: any) {
    logger.error({ error }, "Error generating multiple templates");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to generate templates",
    });
  }
};

/**
 * Get all active templates
 * GET /api/templates
 * Query params:
 *   - type: filter by template type
 *   - scope: "generic" or "business_specific"
 *   - businessId: get templates for specific business (includes generic + business-specific)
 *   - industryId: filter templates by industry (category from industryList API)
 *   - categoryId: filter templates by subcategory (from businessCategoryList API)
 *   - categoryIds: filter templates by multiple subcategories (comma-separated)
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { type, scope, businessId, industryId, categoryId, categoryIds } = req.query;

    let templates;

    // Parse categoryIds if provided as comma-separated string
    const parsedCategoryIds = categoryIds
      ? (categoryIds as string).split(',').map(id => id.trim())
      : undefined;

    // If businessId provided, get all templates available for that business
    if (businessId) {
      templates = await findTemplatesForBusiness(
        businessId as string,
        industryId as string | undefined
      );
    }
    // If industry and categories provided, filter by both
    else if (industryId && (categoryId || parsedCategoryIds)) {
      const categoryIdsArray = categoryId
        ? [categoryId as string]
        : parsedCategoryIds;
      templates = await findTemplatesByIndustryAndCategories(
        industryId as string,
        categoryIdsArray
      );
    }
    // If only categoryId provided, filter by category
    else if (categoryId) {
      templates = await findTemplatesByCategory(categoryId as string);
    }
    // If scope is generic, get only generic templates
    else if (scope === "generic") {
      templates = await findGenericTemplates({
        type: type as TemplateType | undefined,
        industryId: industryId as string | undefined,
      });
    }
    // If scope is business_specific, need businessId
    else if (scope === "business_specific") {
      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: "businessId is required when scope is business_specific",
        });
      }
      templates = await findBusinessSpecificTemplates(businessId as string);
    }
    // Fallback to existing logic
    else if (type) {
      templates = await findTemplatesByType(type as TemplateType);
    } else if (industryId) {
      templates = await findTemplatesByIndustry(industryId as string);
    } else {
      templates = await findActiveTemplates();
    }

    return res.status(200).json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error: any) {
    logger.error({ error }, "Error fetching templates");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to fetch templates",
    });
  }
};

/**
 * Get a specific template by ID
 * GET /api/templates/:id
 */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await findTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    logger.error({ error, templateId: req.params.id }, "Error fetching template");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to fetch template",
    });
  }
};

/**
 * Manually trigger overnight template update job
 * POST /api/templates/update-all
 */
export const triggerTemplateUpdate = async (_req: Request, res: Response) => {
  try {
    logger.info("Manually triggering template update job");

    // Run the job asynchronously
    TemplateUpdateJob.execute().catch((error) => {
      logger.error({ error }, "Template update job failed");
    });

    return res.status(202).json({
      success: true,
      message: "Template update job triggered successfully",
    });
  } catch (error: any) {
    logger.error({ error }, "Error triggering template update");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to trigger template update",
    });
  }
};

/**
 * Generate templates for all trained businesses
 * POST /api/templates/generate-for-all-businesses
 */
export const generateForAllBusinesses = async (_req: Request, res: Response) => {
  try {
    logger.info("Generating templates for all trained businesses");

    // Run the job asynchronously
    TemplateUpdateJob.generateTemplatesForAllBusinesses().catch((error) => {
      logger.error({ error }, "Template generation for all businesses failed");
    });

    return res.status(202).json({
      success: true,
      message: "Template generation for all businesses triggered successfully",
    });
  } catch (error: any) {
    logger.error({ error }, "Error generating templates for all businesses");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to generate templates for all businesses",
    });
  }
};

/**
 * Generate generic templates for a specific industry
 * POST /api/templates/generate-generic-for-industry
 */
export const generateGenericForIndustry = async (req: Request, res: Response) => {
  try {
    const { industryId, occasions } = req.body;

    if (!industryId) {
      return res.status(400).json({
        success: false,
        error: "industryId is required",
      });
    }

    logger.info({ industryId }, "Generating generic templates for industry");

    const defaultOccasions = occasions || [
      { occasion: "general" },
      { occasion: "seasonal" },
      { occasion: "holiday", specificHoliday: "Holiday Season" },
      { occasion: "trending" },
    ];

    const templates = await DealTemplateGeneratorService.generateGenericTemplatesForIndustry(
      industryId,
      defaultOccasions
    );

    return res.status(201).json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error: any) {
    logger.error({ error }, "Error generating generic templates for industry");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to generate generic templates",
    });
  }
};

/**
 * Trigger scheduled job on demand (for testing)
 * POST /api/templates/trigger-scheduled-job
 */
export const triggerScheduledJob = async (req: Request, res: Response) => {
  try {
    const { jobName, dayOfWeek } = req.body;

    if (!jobName) {
      return res.status(400).json({
        success: false,
        error: "jobName is required. Use 'template-update' or 'daily-template' to trigger jobs.",
      });
    }

    // Validate dayOfWeek if provided
    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return res.status(400).json({
        success: false,
        error: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)",
      });
    }

    logger.info({ jobName, dayOfWeek }, "Manually triggering scheduled job");

    // Trigger the job asynchronously
    JobScheduler.triggerJob(jobName, { dayOfWeek })
      .then(() => {
        logger.info({ jobName }, "Scheduled job completed successfully");
      })
      .catch((error) => {
        logger.error({ error, jobName }, "Scheduled job failed");
      });

    return res.status(202).json({
      success: true,
      message: `Scheduled job '${jobName}' triggered successfully`,
      note: "Job is running asynchronously. Check logs for completion status.",
      ...(dayOfWeek !== undefined && { dayOfWeek }),
    });
  } catch (error: any) {
    logger.error({ error }, "Error triggering scheduled job");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to trigger scheduled job",
    });
  }
};

/**
 * Trigger daily template generation for a specific day
 * POST /api/templates/trigger-daily-template
 */
export const triggerDailyTemplate = async (req: Request, res: Response) => {
  try {
    const { dayOfWeek } = req.body;

    // Validate dayOfWeek if provided
    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return res.status(400).json({
        success: false,
        error: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)",
        dayMapping: {
          0: "Sunday (Self-Care Sunday)",
          1: "Monday (Motivation Monday)",
          2: "Tuesday (Two-for-Tuesday)",
          3: "Wednesday (Midweek Madness)",
          4: "Thursday (Throwback Thursday)",
          5: "Friday (Friday Deals & Offers)",
          6: "Saturday (Saturday Special)",
        },
      });
    }

    const dayNames = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday"
    ];
    const themes = [
      "Self-Care Sunday", "Motivation Monday", "Two-for-Tuesday",
      "Midweek Madness", "Throwback Thursday", "Friday Deals & Offers",
      "Saturday Special"
    ];

    const targetDay = dayOfWeek !== undefined ? dayOfWeek : new Date().getDay();
    const dayName = dayNames[targetDay];
    const theme = themes[targetDay];

    logger.info({ dayOfWeek: targetDay, dayName, theme }, "Triggering daily template generation");

    // Trigger the job asynchronously
    JobScheduler.triggerJob("daily-template", { dayOfWeek: targetDay })
      .then(() => {
        logger.info({ dayName, theme }, "Daily template generation completed successfully");
      })
      .catch((error) => {
        logger.error({ error, dayName }, "Daily template generation failed");
      });

    return res.status(202).json({
      success: true,
      message: `Daily template generation triggered for ${dayName}`,
      theme,
      dayOfWeek: targetDay,
      note: "Job is running asynchronously. Check logs for completion status.",
    });
  } catch (error: any) {
    logger.error({ error }, "Error triggering daily template generation");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to trigger daily template generation",
    });
  }
};

/**
 * Get status of all scheduled jobs
 * GET /api/templates/scheduler-status
 */
export const getSchedulerStatus = async (_req: Request, res: Response) => {
  try {
    const status = JobScheduler.getStatus();

    return res.status(200).json({
      success: true,
      data: status,
      count: status.length,
      aiTemplateGenerationEnabled: env.ENABLE_AI_TEMPLATE_GENERATION,
    });
  } catch (error: any) {
    logger.error({ error }, "Error getting scheduler status");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to get scheduler status",
    });
  }
};

/**
 * Generate templates for all AI agents (trained and untrained)
 * POST /api/templates/generate-for-all-agents
 */
export const generateForAllAgents = async (_req: Request, res: Response) => {
  try {
    logger.info("Generating templates for all AI agents");

    // Run the job asynchronously
    AgentTemplateGenerationJob.execute().catch((error) => {
      logger.error({ error }, "Agent template generation job failed");
    });

    return res.status(202).json({
      success: true,
      message: "Template generation for all AI agents triggered successfully",
      note: "Job is running asynchronously. Check logs for completion status. This will generate templates with AI images for all agents based on their training status.",
    });
  } catch (error: any) {
    logger.error({ error }, "Error generating templates for all AI agents");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to generate templates for all AI agents",
    });
  }
};
