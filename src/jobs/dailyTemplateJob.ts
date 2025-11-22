import { logger } from "../utils/logger.js";
import {
  DealTemplateGeneratorService,
  DaySpecificOccasion,
} from "../api/services/dealTemplateGenerator.service.js";
import { AI_TrainingModel } from "../models/AI_Training.model.js";

/**
 * Day-specific occasion mapping
 * Maps day of week (0-6, where 0 is Sunday) to the occasion type
 */
const DAY_OCCASION_MAP: Record<number, DaySpecificOccasion> = {
  0: "sunday_selfcare",
  1: "monday_motivation",
  2: "tuesday_twofer",
  3: "wednesday_midweek",
  4: "thursday_throwback",
  5: "friday_deals",
  6: "saturday_special",
};

const DAY_NAMES: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

/**
 * Daily Template Job
 * Generates day-specific themed templates for all trained businesses
 */
export class DailyTemplateJob {
  /**
   * Execute the daily template generation job
   * This will:
   * 1. Determine the current day's occasion
   * 2. Generate day-specific templates for all trained businesses
   * 3. Generate generic day-specific templates for all industries
   */
  static async execute(): Promise<void> {
    const startTime = Date.now();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const occasion = DAY_OCCASION_MAP[dayOfWeek];
    const dayName = DAY_NAMES[dayOfWeek];

    logger.info(
      { dayOfWeek, dayName, occasion },
      "Starting daily template generation job"
    );

    try {
      // Generate business-specific templates
      const businessResult = await this.generateBusinessSpecificTemplates(occasion);

      // Generate generic templates for all industries
      const genericResult = await this.generateGenericTemplates(occasion);

      const duration = Date.now() - startTime;
      logger.info(
        {
          dayName,
          occasion,
          businessTemplates: businessResult,
          genericTemplates: genericResult,
          durationMs: duration,
        },
        "Daily template generation job completed"
      );
    } catch (error: any) {
      logger.error({ error, occasion }, "Error in daily template generation job");
      throw error;
    }
  }

  /**
   * Execute job for a specific day (for testing or manual triggering)
   */
  static async executeForDay(dayOfWeek: number): Promise<void> {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error("Day of week must be between 0 (Sunday) and 6 (Saturday)");
    }

    const startTime = Date.now();
    const occasion = DAY_OCCASION_MAP[dayOfWeek];
    const dayName = DAY_NAMES[dayOfWeek];

    logger.info(
      { dayOfWeek, dayName, occasion },
      "Starting daily template generation job for specific day"
    );

    try {
      // Generate business-specific templates
      const businessResult = await this.generateBusinessSpecificTemplates(occasion);

      // Generate generic templates for all industries
      const genericResult = await this.generateGenericTemplates(occasion);

      const duration = Date.now() - startTime;
      logger.info(
        {
          dayName,
          occasion,
          businessTemplates: businessResult,
          genericTemplates: genericResult,
          durationMs: duration,
        },
        "Daily template generation job completed for specific day"
      );
    } catch (error: any) {
      logger.error({ error, occasion, dayName }, "Error in daily template generation job");
      throw error;
    }
  }

  /**
   * Generate business-specific templates for all trained businesses
   */
  private static async generateBusinessSpecificTemplates(
    occasion: DaySpecificOccasion
  ): Promise<{ total: number; success: number; failed: number }> {
    // Find all businesses with completed training
    const trainedBusinesses = await AI_TrainingModel.find({
      trainingStatus: "completed",
    });

    logger.info(
      { count: trainedBusinesses.length },
      "Found trained businesses for daily templates"
    );

    let successCount = 0;
    let failureCount = 0;

    for (const training of trainedBusinesses) {
      try {
        await DealTemplateGeneratorService.generateAndSaveDealTemplate(
          training.businessId.toString(),
          {
            occasion,
            scope: "business_specific",
          }
        );

        successCount++;
        logger.info(
          { businessId: training.businessId, occasion },
          "Generated daily business-specific template"
        );
      } catch (error: any) {
        failureCount++;
        logger.error(
          { error, businessId: training.businessId, occasion },
          "Failed to generate daily business-specific template"
        );
      }
    }

    return {
      total: trainedBusinesses.length,
      success: successCount,
      failed: failureCount,
    };
  }

  /**
   * Generate generic templates for all industries
   */
  private static async generateGenericTemplates(
    occasion: DaySpecificOccasion
  ): Promise<{ total: number; success: number; failed: number }> {
    // Find all unique industries from trained businesses
    const industries = await AI_TrainingModel.distinct("industry", {
      trainingStatus: "completed",
    });

    logger.info(
      { count: industries.length },
      "Found industries for generic daily templates"
    );

    let successCount = 0;
    let failureCount = 0;

    for (const industryId of industries) {
      try {
        await DealTemplateGeneratorService.generateGenericTemplatesForIndustry(
          industryId.toString(),
          [{ occasion }]
        );

        successCount++;
        logger.info(
          { industryId, occasion },
          "Generated generic daily template for industry"
        );
      } catch (error: any) {
        failureCount++;
        logger.error(
          { error, industryId, occasion },
          "Failed to generate generic daily template for industry"
        );
      }
    }

    return {
      total: industries.length,
      success: successCount,
      failed: failureCount,
    };
  }

  /**
   * Get the occasion for a specific day
   */
  static getOccasionForDay(dayOfWeek: number): DaySpecificOccasion {
    return DAY_OCCASION_MAP[dayOfWeek];
  }

  /**
   * Get today's occasion
   */
  static getTodaysOccasion(): DaySpecificOccasion {
    return DAY_OCCASION_MAP[new Date().getDay()];
  }

  /**
   * Get the day name for a day of week
   */
  static getDayName(dayOfWeek: number): string {
    return DAY_NAMES[dayOfWeek];
  }
}
