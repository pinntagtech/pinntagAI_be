import { Request, Response } from "express";
import { logger } from "../../utils/logger.js";
import { DemoTemplateGeneratorService } from "../services/demoTemplateGenerator.service.js";

/**
 * Demo Template Controller
 *
 * Separate controller for demo/showcase template generation.
 * Does NOT modify or interfere with existing template generation APIs.
 */

/**
 * Generate 20 demo templates for a business
 * POST /api/demo-templates/generate
 * Body: { businessId: string }
 */
export const generateDemoTemplates = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: "businessId is required",
      });
    }

    logger.info({ businessId }, "Demo template generation requested");

    // Run generation (this will take a while due to 20 AI calls + 20 image generations)
    const templates = await DemoTemplateGeneratorService.generateDemoTemplates(businessId);

    return res.status(201).json({
      success: true,
      data: templates,
      count: templates.length,
      message: `Successfully generated ${templates.length} demo templates`,
    });
  } catch (error: any) {
    logger.error({ error }, "Error generating demo templates");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to generate demo templates",
    });
  }
};

/**
 * Generate 20 demo templates asynchronously (fire-and-forget)
 * POST /api/demo-templates/generate-async
 * Body: { businessId: string }
 *
 * Returns immediately with 202 Accepted while templates generate in the background.
 */
export const generateDemoTemplatesAsync = async (req: Request, res: Response) => {
  try {
    const { businessId } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: "businessId is required",
      });
    }

    logger.info({ businessId }, "Async demo template generation requested");

    // Fire and forget
    DemoTemplateGeneratorService.generateDemoTemplates(businessId)
      .then((templates) => {
        logger.info(
          { businessId, count: templates.length },
          "Async demo template generation completed"
        );
      })
      .catch((error) => {
        logger.error(
          { businessId, error: error.message },
          "Async demo template generation failed"
        );
      });

    return res.status(202).json({
      success: true,
      message: "Demo template generation started. 20 templates will be generated in the background.",
      note: "Templates will include AI-generated images and titles. Check logs or query templates by businessId to see results.",
    });
  } catch (error: any) {
    logger.error({ error }, "Error starting async demo template generation");
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to start demo template generation",
    });
  }
};
