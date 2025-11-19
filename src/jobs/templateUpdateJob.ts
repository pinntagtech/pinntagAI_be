import { logger } from "../utils/logger.js";
import { DealTemplateGeneratorService } from "../api/services/dealTemplateGenerator.service.js";
import { findTemplatesForUpdate } from "../models/pinntagBackend/dealTemplate.model.js";
import { AI_TrainingModel } from "../models/AI_Training.model.js";

/**
 * Template Update Job
 * Runs overnight to refresh AI-generated deal templates
 */
export class TemplateUpdateJob {
  /**
   * Execute the overnight template update job
   * This will:
   * 1. Find all templates that need updating
   * 2. For each template, regenerate with latest AI data
   * 3. Update the database with new content
   */
  static async execute(): Promise<void> {
    const startTime = Date.now();
    logger.info("Starting overnight template update job");

    try {
      // Find all templates that need updating
      const templatesToUpdate = await findTemplatesForUpdate();

      if (templatesToUpdate.length === 0) {
        logger.info("No templates need updating at this time");
        return;
      }

      logger.info(
        { count: templatesToUpdate.length },
        "Found templates to update"
      );

      // Process each template
      let successCount = 0;
      let failureCount = 0;

      for (const template of templatesToUpdate) {
        try {
          // Extract business ID from template
          const businessId = await this.getBusinessIdForTemplate(template);

          if (!businessId) {
            logger.warn(
              { templateId: template._id },
              "Could not find business ID for template, skipping"
            );
            failureCount++;
            continue;
          }

          // Regenerate the template
          await DealTemplateGeneratorService.generateAndSaveDealTemplate(
            businessId,
            {
              occasion: template.aiGenerationData?.occasion as any,
              specificHoliday: template.aiGenerationData?.specificHoliday,
              promotionalGoal: template.aiGenerationData?.promotionalGoal,
              businessIndustryId: template.businessIndustry?.toString(),
              businessCategoryIds: template.businessCategories?.map(c => c.toString()),
              thumbnailUrl: template.thumbnail,
            }
          );

          successCount++;
          logger.info(
            { templateId: template._id, businessId },
            "Template updated successfully"
          );
        } catch (error: any) {
          failureCount++;
          logger.error(
            { error, templateId: template._id },
            "Failed to update template"
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        {
          total: templatesToUpdate.length,
          success: successCount,
          failed: failureCount,
          durationMs: duration,
        },
        "Overnight template update job completed"
      );
    } catch (error: any) {
      logger.error({ error }, "Error in overnight template update job");
      throw error;
    }
  }

  /**
   * Generate fresh templates for all trained businesses
   * Generates both business-specific and generic templates
   */
  static async generateTemplatesForAllBusinesses(): Promise<void> {
    logger.info("Generating templates for all trained businesses");

    try {
      // Find all businesses with completed training
      const trainedBusinesses = await AI_TrainingModel.find({
        trainingStatus: "completed",
      });

      logger.info(
        { count: trainedBusinesses.length },
        "Found trained businesses"
      );

      let businessSuccessCount = 0;
      let businessFailureCount = 0;

      // Generate business-specific templates
      for (const training of trainedBusinesses) {
        try {
          // Generate business-specific templates for common occasions
          const occasions = [
            { occasion: "general" as const, scope: "business_specific" as const },
            { occasion: "seasonal" as const, scope: "business_specific" as const },
            { occasion: "slow_period" as const, scope: "business_specific" as const },
            { occasion: "trending" as const, scope: "business_specific" as const },
          ];

          await DealTemplateGeneratorService.generateAndSaveMultipleTemplates(
            training.businessId.toString(),
            occasions
          );

          businessSuccessCount++;
          logger.info(
            { businessId: training.businessId },
            "Generated business-specific templates"
          );
        } catch (error: any) {
          businessFailureCount++;
          logger.error(
            { error, businessId: training.businessId },
            "Failed to generate business-specific templates"
          );
        }
      }

      logger.info(
        {
          total: trainedBusinesses.length,
          success: businessSuccessCount,
          failed: businessFailureCount,
        },
        "Business-specific template generation completed"
      );

      // Generate generic templates for each industry
      await this.generateGenericTemplatesForIndustries();

    } catch (error: any) {
      logger.error(
        { error },
        "Error generating templates for all businesses"
      );
      throw error;
    }
  }

  /**
   * Generate generic templates for all industries
   */
  static async generateGenericTemplatesForIndustries(): Promise<void> {
    logger.info("Generating generic templates for all industries");

    try {
      // Find all unique industries from trained businesses
      const industries = await AI_TrainingModel.distinct("industry", {
        trainingStatus: "completed",
      });

      logger.info(
        { count: industries.length },
        "Found industries with trained businesses"
      );

      let successCount = 0;
      let failureCount = 0;

      for (const industryId of industries) {
        try {
          const occasions = [
            { occasion: "general" as const },
            { occasion: "seasonal" as const },
            { occasion: "holiday" as const, specificHoliday: "Holiday Season" },
            { occasion: "trending" as const },
          ];

          await DealTemplateGeneratorService.generateGenericTemplatesForIndustry(
            industryId.toString(),
            occasions
          );

          successCount++;
          logger.info(
            { industryId },
            "Generated generic templates for industry"
          );
        } catch (error: any) {
          failureCount++;
          logger.error(
            { error, industryId },
            "Failed to generate generic templates for industry"
          );
        }
      }

      logger.info(
        {
          total: industries.length,
          success: successCount,
          failed: failureCount,
        },
        "Generic template generation completed"
      );
    } catch (error: any) {
      logger.error(
        { error },
        "Error generating generic templates"
      );
      throw error;
    }
  }

  /**
   * Helper to get business ID from a template
   * This attempts to find the business that matches the template's industry
   */
  private static async getBusinessIdForTemplate(
    template: any
  ): Promise<string | null> {
    try {
      // If template has industry, find a business in that industry
      if (template.businessIndustry) {
        const training = await AI_TrainingModel.findOne({
          industry: template.businessIndustry,
          trainingStatus: "completed",
        });

        if (training) {
          return training.businessId.toString();
        }
      }

      // Fallback: get any trained business
      const anyTraining = await AI_TrainingModel.findOne({
        trainingStatus: "completed",
      });

      return anyTraining ? anyTraining.businessId.toString() : null;
    } catch (error: any) {
      logger.error(
        { error, templateId: template._id },
        "Error getting business ID for template"
      );
      return null;
    }
  }
}
