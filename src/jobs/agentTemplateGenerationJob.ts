import { logger } from "../utils/logger.js";
import { AI_TrainingModel } from "../models/AI_Training.model.js";
import { BusinessAIAssistantModel } from "../models/businessAIAssistant.model.js";
import { DealTemplateGeneratorService, TemplateGenerationOptions, DaySpecificOccasion } from "../api/services/dealTemplateGenerator.service.js";
import { DiscountType } from "../models/pinntagBackend/dealTemplate.model.js";
import { ImageGenerationService } from "../api/services/imageGeneration.service.js";
import mongoose from "mongoose";

/**
 * Holiday and occasion detection configuration
 */
interface Holiday {
  name: string;
  month: number; // 0-11 (January is 0)
  day: number;
  startDaysBefore: number; // Days before to start showing
  endDaysAfter: number; // Days after to stop showing
}

const HOLIDAYS: Holiday[] = [
  // ========== JANUARY ==========
  { name: "New Year", month: 0, day: 1, startDaysBefore: 7, endDaysAfter: 3 },
  { name: "January Sales", month: 0, day: 10, startDaysBefore: 5, endDaysAfter: 21 }, // Winter sales period
  { name: "Martin Luther King Jr. Day", month: 0, day: 15, startDaysBefore: 7, endDaysAfter: 1 }, // US - 3rd Monday
  { name: "Burns Night", month: 0, day: 25, startDaysBefore: 7, endDaysAfter: 1 }, // Scotland

  // ========== FEBRUARY ==========
  { name: "Super Bowl", month: 1, day: 12, startDaysBefore: 7, endDaysAfter: 1 }, // US - 2nd Sunday (approx)
  { name: "Valentine's Day", month: 1, day: 14, startDaysBefore: 14, endDaysAfter: 1 },
  { name: "Presidents' Day", month: 1, day: 19, startDaysBefore: 7, endDaysAfter: 1 }, // US - 3rd Monday

  // ========== MARCH ==========
  { name: "Pancake Day", month: 2, day: 5, startDaysBefore: 7, endDaysAfter: 1 }, // Shrove Tuesday (varies)
  { name: "International Women's Day", month: 2, day: 8, startDaysBefore: 5, endDaysAfter: 1 },
  { name: "UK Mother's Day", month: 2, day: 19, startDaysBefore: 14, endDaysAfter: 1 }, // Mothering Sunday - 4th Sunday of Lent (approx)
  { name: "St. Patrick's Day", month: 2, day: 17, startDaysBefore: 7, endDaysAfter: 1 },

  // ========== APRIL ==========
  { name: "Easter Weekend", month: 3, day: 9, startDaysBefore: 14, endDaysAfter: 3 }, // Good Friday - Easter Monday (varies)
  { name: "Earth Day", month: 3, day: 22, startDaysBefore: 7, endDaysAfter: 1 },
  { name: "St. George's Day", month: 3, day: 23, startDaysBefore: 5, endDaysAfter: 1 }, // England

  // ========== MAY ==========
  { name: "Early May Bank Holiday", month: 4, day: 1, startDaysBefore: 7, endDaysAfter: 1 }, // UK - 1st Monday
  { name: "Cinco de Mayo", month: 4, day: 5, startDaysBefore: 5, endDaysAfter: 1 }, // US/Mexico
  { name: "Mother's Day", month: 4, day: 14, startDaysBefore: 14, endDaysAfter: 1 }, // US - 2nd Sunday
  { name: "Chelsea Flower Show", month: 4, day: 23, startDaysBefore: 7, endDaysAfter: 5 }, // UK - late May
  { name: "Spring Bank Holiday", month: 4, day: 29, startDaysBefore: 7, endDaysAfter: 1 }, // UK - last Monday
  { name: "Memorial Day", month: 4, day: 29, startDaysBefore: 7, endDaysAfter: 1 }, // US - last Monday

  // ========== JUNE ==========
  { name: "Graduation Season", month: 5, day: 10, startDaysBefore: 14, endDaysAfter: 20 }, // Peak graduation period
  { name: "Father's Day", month: 5, day: 18, startDaysBefore: 14, endDaysAfter: 1 }, // 3rd Sunday
  { name: "Juneteenth", month: 5, day: 19, startDaysBefore: 7, endDaysAfter: 1 }, // US
  { name: "Wimbledon", month: 5, day: 28, startDaysBefore: 7, endDaysAfter: 14 }, // UK - late June-early July

  // ========== JULY ==========
  { name: "Independence Day", month: 6, day: 4, startDaysBefore: 14, endDaysAfter: 2 }, // US
  { name: "Summer BBQ Season", month: 6, day: 15, startDaysBefore: 10, endDaysAfter: 30 }, // Peak summer

  // ========== AUGUST ==========
  { name: "Summer Bank Holiday", month: 7, day: 28, startDaysBefore: 7, endDaysAfter: 1 }, // UK - last Monday
  { name: "Notting Hill Carnival", month: 7, day: 27, startDaysBefore: 7, endDaysAfter: 2 }, // UK - late August
  { name: "Back to School", month: 7, day: 20, startDaysBefore: 21, endDaysAfter: 14 },

  // ========== SEPTEMBER ==========
  { name: "Labor Day", month: 8, day: 4, startDaysBefore: 7, endDaysAfter: 1 }, // US - 1st Monday
  { name: "NFL Season Kickoff", month: 8, day: 8, startDaysBefore: 7, endDaysAfter: 1 }, // US - early September
  { name: "Premier League Start", month: 8, day: 12, startDaysBefore: 7, endDaysAfter: 7 }, // UK - mid-August/early September

  // ========== OCTOBER ==========
  { name: "International Coffee Day", month: 9, day: 1, startDaysBefore: 3, endDaysAfter: 1 },
  { name: "Columbus Day", month: 9, day: 9, startDaysBefore: 5, endDaysAfter: 1 }, // US - 2nd Monday
  { name: "Halloween", month: 9, day: 31, startDaysBefore: 21, endDaysAfter: 1 },

  // ========== NOVEMBER ==========
  { name: "Guy Fawkes Night", month: 10, day: 5, startDaysBefore: 7, endDaysAfter: 1 }, // UK - Bonfire Night
  { name: "Veterans Day", month: 10, day: 11, startDaysBefore: 7, endDaysAfter: 1 }, // US
  { name: "Remembrance Day", month: 10, day: 11, startDaysBefore: 7, endDaysAfter: 1 }, // UK
  { name: "Thanksgiving", month: 10, day: 23, startDaysBefore: 14, endDaysAfter: 3 }, // US - 4th Thursday
  { name: "Black Friday", month: 10, day: 24, startDaysBefore: 10, endDaysAfter: 3 },
  { name: "Small Business Saturday", month: 10, day: 25, startDaysBefore: 7, endDaysAfter: 1 }, // US
  { name: "Cyber Monday", month: 10, day: 27, startDaysBefore: 7, endDaysAfter: 3 },

  // ========== DECEMBER ==========
  { name: "Christmas Season", month: 11, day: 1, startDaysBefore: 0, endDaysAfter: 31 }, // All of December
  { name: "Hanukkah", month: 11, day: 10, startDaysBefore: 14, endDaysAfter: 8 }, // Varies yearly
  { name: "Christmas", month: 11, day: 25, startDaysBefore: 30, endDaysAfter: 7 },
  { name: "Boxing Day", month: 11, day: 26, startDaysBefore: 5, endDaysAfter: 5 }, // UK
  { name: "Kwanzaa", month: 11, day: 26, startDaysBefore: 7, endDaysAfter: 7 },
  { name: "New Year's Eve", month: 11, day: 31, startDaysBefore: 7, endDaysAfter: 1 },
];

/**
 * Agent Template Generation Job
 * Runs overnight to generate templates for all AI agents based on their training status
 *
 * For trained agents: Uses training data to generate business-specific templates
 * For untrained agents: Uses agent metadata (category, subcategories, tags, description) to generate templates
 */
export class AgentTemplateGenerationJob {
  /**
   * Detect active holidays and occasions based on current date
   */
  private static detectCurrentOccasions(currentDate: Date = new Date()): string[] {
    const occasions: string[] = [];
    const now = currentDate.getTime();

    for (const holiday of HOLIDAYS) {
      // Create date for this year's holiday
      const holidayDate = new Date(currentDate.getFullYear(), holiday.month, holiday.day);

      // Calculate start and end dates for the promotion period
      const startDate = new Date(holidayDate);
      startDate.setDate(startDate.getDate() - holiday.startDaysBefore);

      const endDate = new Date(holidayDate);
      endDate.setDate(endDate.getDate() + holiday.endDaysAfter);

      // Check if current date is within the promotion period
      if (now >= startDate.getTime() && now <= endDate.getTime()) {
        occasions.push(holiday.name);
      }
    }

    return occasions;
  }

  /**
   * Get the current season based on date
   */
  private static getCurrentSeason(date: Date = new Date()): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer";
    if (month >= 8 && month <= 10) return "Fall";
    return "Winter";
  }

  /**
   * Determine which day-specific template to generate based on current day
   */
  private static getCurrentDayOccasion(date: Date = new Date()): string | null {
    const dayOfWeek = date.getDay();
    const dayMap: Record<number, string> = {
      1: "monday_motivation",
      2: "tuesday_twofer",
      3: "wednesday_midweek",
      4: "thursday_throwback",
      5: "friday_deals",
      6: "saturday_special",
      0: "sunday_selfcare",
    };

    return dayMap[dayOfWeek] || null;
  }

  /**
   * Execute the overnight agent template generation job
   * Generates templates for ALL AI agents regardless of training status
   */
  static async execute(): Promise<void> {
    const startTime = Date.now();
    logger.info("Starting overnight agent template generation job");

    try {
      // Find all business AI agents
      const allAgents = await BusinessAIAssistantModel.find({});

      if (allAgents.length === 0) {
        logger.info("No AI agents found to generate templates for");
        return;
      }

      logger.info(
        { count: allAgents.length },
        "Found AI agents to generate templates for"
      );

      let successCount = 0;
      let failureCount = 0;
      let trainedCount = 0;
      let untrainedCount = 0;

      for (const agent of allAgents) {
        try {
          const businessId = agent.businessId.toString();

          // Check training status
          const training = await AI_TrainingModel.findOne({
            businessId: new mongoose.Types.ObjectId(businessId),
          });

          const isTrained = training && training.trainingStatus === "completed";

          if (isTrained) {
            // Generate training-based templates for trained agents
            await this.generateTrainingBasedTemplates(agent, businessId);
            trainedCount++;
            logger.info(
              { businessId, agentName: agent.name },
              "Generated training-based templates for trained agent"
            );
          } else {
            // Generate metadata-based templates for untrained agents
            await this.generateMetadataBasedTemplates(agent, businessId);
            untrainedCount++;
            logger.info(
              { businessId, agentName: agent.name },
              "Generated metadata-based templates for untrained agent"
            );
          }

          successCount++;
        } catch (error: any) {
          failureCount++;
          logger.error(
            { error, agentId: agent._id, agentName: agent.name },
            "Failed to generate templates for agent"
          );
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        {
          total: allAgents.length,
          success: successCount,
          failed: failureCount,
          trained: trainedCount,
          untrained: untrainedCount,
          durationMs: duration,
        },
        "Overnight agent template generation job completed"
      );
    } catch (error: any) {
      logger.error({ error }, "Error in overnight agent template generation job");
      throw error;
    }
  }

  /**
   * On-demand template generation for a single business.
   * Generates `count` templates with AI images and saves them.
   * Mirrors the trained/untrained dispatch from execute() but for one business
   * and pads the occasion list to always reach `count` templates.
   */
  static async executeForBusiness(
    businessId: string,
    count: number = 10
  ): Promise<{
    successCount: number;
    failureCount: number;
    isTrained: boolean;
    templates: any[];
  }> {
    const startTime = Date.now();
    logger.info({ businessId, count }, "Starting on-demand template generation");

    const agent = await BusinessAIAssistantModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!agent) {
      throw new Error(`No AI agent found for business ID: ${businessId}`);
    }

    const training = await AI_TrainingModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    const isTrained = !!(training && training.trainingStatus === "completed");

    const occasionPlan = this.buildOnDemandOccasionPlan(count);

    const templates: any[] = [];
    let failureCount = 0;

    if (isTrained) {
      const responseMap = new Map(
        training!.responses.map((r) => [r.questionId, r.answer])
      );
      const trainingBrandVoiceRaw = responseMap.get("brand_voice");
      const trainingBrandVoice = Array.isArray(trainingBrandVoiceRaw)
        ? trainingBrandVoiceRaw
        : typeof trainingBrandVoiceRaw === "string" && trainingBrandVoiceRaw
        ? [trainingBrandVoiceRaw]
        : [];
      const trainingTargetAudience = (responseMap.get("target_audience") as string[]) || [];

      for (const occasion of occasionPlan) {
        try {
          const template = await DealTemplateGeneratorService.generateDealTemplate(
            businessId,
            occasion
          );

          const imageUrl = await this.generateGenericTemplateImage(
            businessId,
            template.title,
            agent.category,
            agent.subCategories,
            occasion.occasion,
            {
              industry: training?.industry,
              ...this.buildSubjectContext(responseMap, agent.subCategories),
              promotionType: template.discountType,
              contentType: template.contentType,
              targetAudience: trainingTargetAudience,
              brandVoice: trainingBrandVoice,
            }
          );

          const saved = await DealTemplateGeneratorService.savePreGeneratedTemplate(
            businessId,
            template,
            { ...occasion, thumbnailUrl: imageUrl }
          );

          templates.push(saved);
        } catch (error: any) {
          failureCount++;
          logger.error(
            { businessId, occasion: occasion.occasion, error: error.message },
            "On-demand: failed to generate trained-agent template"
          );
        }
      }
    } else {
      const { category, subCategories, tags, description } = agent as any;

      for (const occasionOption of occasionPlan) {
        const occasion = occasionOption.occasion!;
        try {
          const title = this.buildMetadataTitle(occasion, occasionOption.specificHoliday);
          const descriptionText = this.buildMetadataDescription(
            occasion,
            category,
            subCategories,
            tags,
            description,
            occasionOption.specificHoliday
          );

          const isBogo = occasion === "tuesday_twofer";
          const isFreeItem = occasion === "sunday_selfcare";
          const occasionPromotionType = isBogo
            ? "bogo"
            : isFreeItem
            ? "free_item"
            : "percentage_off";
          const occasionContentType = occasion === "saturday_special" ? "event" : "offer";

          const imageUrl = await this.generateGenericTemplateImage(
            businessId,
            title,
            category,
            subCategories,
            occasion,
            {
              industry: category,
              visualSubject: this.formatVisualSubject(tags || [], subCategories),
              promotionType: occasionPromotionType,
              contentType: occasionContentType,
            }
          );

          const templateOptions: TemplateGenerationOptions = {
            occasion,
            specificHoliday: occasionOption.specificHoliday,
            scope: "business_specific",
            thumbnailUrl: imageUrl,
            categories: subCategories || [],
          };

          const saved = await this.saveMetadataBasedTemplate(
            businessId,
            agent,
            templateOptions,
            title,
            descriptionText,
            imageUrl
          );

          templates.push(saved);
        } catch (error: any) {
          failureCount++;
          logger.error(
            { businessId, occasion, error: error.message },
            "On-demand: failed to generate metadata-based template"
          );
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.info(
      {
        businessId,
        isTrained,
        requested: count,
        succeeded: templates.length,
        failed: failureCount,
        durationMs: duration,
      },
      "On-demand template generation completed"
    );

    return {
      successCount: templates.length,
      failureCount,
      isTrained,
      templates,
    };
  }

  /**
   * Build an occasion plan of `count` items, padded with day-of-week themes
   * so on-demand calls always produce the requested number of templates.
   */
  private static buildOnDemandOccasionPlan(
    count: number
  ): TemplateGenerationOptions[] {
    const currentDate = new Date();
    const activeHolidays = this.detectCurrentOccasions(currentDate);
    const dayOccasion = this.getCurrentDayOccasion(currentDate);

    const plan: TemplateGenerationOptions[] = [];

    // Core variety
    plan.push({ occasion: "general", scope: "business_specific" });
    plan.push({ occasion: "seasonal", scope: "business_specific" });
    plan.push({ occasion: "trending", scope: "business_specific" });
    plan.push({ occasion: "slow_period", scope: "business_specific" });

    // Today's day-of-week theme
    if (dayOccasion) {
      plan.push({ occasion: dayOccasion as any, scope: "business_specific" });
    }

    // Active holidays
    for (const holiday of activeHolidays) {
      plan.push({
        occasion: "holiday",
        specificHoliday: holiday,
        scope: "business_specific",
      });
    }

    // Pad with remaining day-of-week themes (skip the one already added)
    const dayThemes: DaySpecificOccasion[] = [
      "friday_deals",
      "saturday_special",
      "sunday_selfcare",
      "monday_motivation",
      "tuesday_twofer",
      "wednesday_midweek",
      "thursday_throwback",
    ];
    for (const theme of dayThemes) {
      if (plan.length >= count) break;
      if (theme === dayOccasion) continue;
      plan.push({ occasion: theme, scope: "business_specific" });
    }

    return plan.slice(0, count);
  }

  /**
   * Build a title for metadata-based templates by occasion.
   */
  private static buildMetadataTitle(occasion: string, holiday?: string): string {
    if (occasion === "holiday" && holiday) {
      return `${holiday} Special - Celebrate with Us!`;
    }
    const titles: Record<string, string> = {
      general: "Special Offer - Exclusive Deal",
      seasonal: "Seasonal Special - Limited Time",
      trending: "Trending Now - Don't Miss Out",
      slow_period: "Off-Peak Savings - Great Value",
      monday_motivation: "Motivation Monday - Start Your Week Right!",
      tuesday_twofer: "Two-for-Tuesday - Double the Value!",
      wednesday_midweek: "Midweek Madness - Hump Day Special!",
      thursday_throwback: "Throwback Thursday - Classic Favorites!",
      friday_deals: "Friday Deals - Weekend Kickoff!",
      saturday_special: "Saturday Special - Family & Friends!",
      sunday_selfcare: "Self-Care Sunday - Treat Yourself!",
    };
    return titles[occasion] || "Special Offer";
  }

  /**
   * Generate templates for trained agents using training data
   */
  private static async generateTrainingBasedTemplates(
    agent: any,
    businessId: string
  ): Promise<void> {
    // Detect current occasions
    const currentDate = new Date();
    const activeHolidays = this.detectCurrentOccasions(currentDate);
    const currentSeason = this.getCurrentSeason(currentDate);
    const dayOccasion = this.getCurrentDayOccasion(currentDate);

    logger.info(
      {
        businessId,
        activeHolidays,
        currentSeason,
        dayOccasion,
      },
      "Detected current occasions for template generation"
    );

    // Build occasions list dynamically based on current date
    const occasions: TemplateGenerationOptions[] = [
      { occasion: "general", scope: "business_specific" },
      { occasion: "seasonal", scope: "business_specific" },
      { occasion: "slow_period", scope: "business_specific" },
      { occasion: "trending", scope: "business_specific" },
    ];

    // Add day-specific template
    if (dayOccasion) {
      occasions.push({
        occasion: dayOccasion as any,
        scope: "business_specific",
      });
    }

    // Add holiday-specific templates for active holidays
    for (const holiday of activeHolidays) {
      occasions.push({
        occasion: "holiday",
        specificHoliday: holiday,
        scope: "business_specific",
      });
    }

    // Fetch training data once so we can enrich the image prompt
    const training = await AI_TrainingModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    });
    const responseMap = training
      ? new Map(training.responses.map((r) => [r.questionId, r.answer]))
      : new Map();

    const trainingBrandVoiceRaw = responseMap.get("brand_voice");
    const trainingBrandVoice = Array.isArray(trainingBrandVoiceRaw)
      ? trainingBrandVoiceRaw
      : typeof trainingBrandVoiceRaw === "string" && trainingBrandVoiceRaw
      ? [trainingBrandVoiceRaw]
      : [];
    const trainingTargetAudience = (responseMap.get("target_audience") as string[]) || [];

    // Generate templates with images — single AI call per occasion
    for (const occasion of occasions) {
      try {
        // Step 1: Generate template content (one AI call)
        const template = await DealTemplateGeneratorService.generateDealTemplate(
          businessId,
          occasion
        );

        // Step 2: Generate image using the template's promotion data + training context
        const imageUrl = await this.generateGenericTemplateImage(
          businessId,
          template.title,
          agent.category,
          agent.subCategories,
          occasion.occasion,
          {
            industry: training?.industry,
            ...this.buildSubjectContext(responseMap, agent.subCategories),
            promotionType: template.discountType,
            contentType: template.contentType,
            targetAudience: trainingTargetAudience,
            brandVoice: trainingBrandVoice,
          }
        );

        // Step 3: Persist the already-generated template (no second AI call)
        await DealTemplateGeneratorService.savePreGeneratedTemplate(
          businessId,
          template,
          { ...occasion, thumbnailUrl: imageUrl }
        );

        logger.info(
          {
            businessId,
            occasion: occasion.occasion,
            imageUrl,
            discountType: template.discountType,
            contentType: template.contentType,
          },
          "Generated and saved template with AI image for trained agent"
        );
      } catch (error: any) {
        logger.error(
          { businessId, occasion: occasion.occasion, error: error.message },
          "Failed to generate template with image for trained agent"
        );
      }
    }
  }

  /**
   * Generate templates for untrained agents using agent metadata
   * (category, subcategories, tags, description)
   */
  private static async generateMetadataBasedTemplates(
    agent: any,
    businessId: string
  ): Promise<void> {
    const { category, subCategories, tags, description } = agent;

    // Detect current occasions
    const currentDate = new Date();
    const activeHolidays = this.detectCurrentOccasions(currentDate);
    const dayOccasion = this.getCurrentDayOccasion(currentDate);

    logger.info(
      { businessId, category, subCategories, tags, activeHolidays, dayOccasion },
      "Generating metadata-based templates for untrained agent"
    );

    // Generate templates based on agent metadata
    const occasions: Array<{
      occasion: TemplateGenerationOptions["occasion"];
      title: string;
      descriptionText: string;
      specificHoliday?: string;
    }> = [
      {
        occasion: "general",
        title: `Special Offer - Exclusive Deal`,
        descriptionText: this.buildMetadataDescription(
          "general",
          category,
          subCategories,
          tags,
          description
        ),
      },
      {
        occasion: "seasonal",
        title: `Seasonal Special - Limited Time`,
        descriptionText: this.buildMetadataDescription(
          "seasonal",
          category,
          subCategories,
          tags,
          description
        ),
      },
      {
        occasion: "trending",
        title: `Trending Now - Don't Miss Out`,
        descriptionText: this.buildMetadataDescription(
          "trending",
          category,
          subCategories,
          tags,
          description
        ),
      },
    ];

    // Add day-specific template
    if (dayOccasion) {
      const dayTitles: Record<string, string> = {
        monday_motivation: "Motivation Monday - Start Your Week Right!",
        tuesday_twofer: "Two-for-Tuesday - Double the Value!",
        wednesday_midweek: "Midweek Madness - Hump Day Special!",
        thursday_throwback: "Throwback Thursday - Classic Favorites!",
        friday_deals: "Friday Deals - Weekend Kickoff!",
        saturday_special: "Saturday Special - Family & Friends!",
        sunday_selfcare: "Self-Care Sunday - Treat Yourself!",
      };

      occasions.push({
        occasion: dayOccasion as any,
        title: dayTitles[dayOccasion] || "Special Day Offer",
        descriptionText: this.buildMetadataDescription(
          dayOccasion,
          category,
          subCategories,
          tags,
          description
        ),
      });
    }

    // Add holiday-specific templates for active holidays
    for (const holiday of activeHolidays) {
      occasions.push({
        occasion: "holiday",
        specificHoliday: holiday,
        title: `${holiday} Special - Celebrate with Us!`,
        descriptionText: this.buildMetadataDescription(
          "holiday",
          category,
          subCategories,
          tags,
          description,
          holiday
        ),
      });
    }

    for (const { occasion, title, descriptionText, specificHoliday } of occasions) {
      try {
        // Derive promotion context from occasion for image enrichment
        const isBogo = occasion === "tuesday_twofer";
        const isFreeItem = occasion === "sunday_selfcare";
        const occasionPromotionType = isBogo ? "bogo" : isFreeItem ? "free_item" : "percentage_off";
        const occasionContentType = occasion === "saturday_special" ? "event" : "offer";

        // Generate AI image with occasion-aware enriched context
        const imageUrl = await this.generateGenericTemplateImage(
          businessId,
          title,
          category,
          subCategories,
          occasion,
          {
            industry: category,
            visualSubject: this.formatVisualSubject(tags || [], subCategories),
            promotionType: occasionPromotionType,
            contentType: occasionContentType,
          }
        );

        // Create a simple template structure for untrained agents
        const templateOptions: TemplateGenerationOptions = {
          occasion,
          specificHoliday,
          scope: "business_specific",
          thumbnailUrl: imageUrl,
          categories: subCategories || [],
        };

        // For untrained agents, we'll create a simplified template
        // We can't use the full generator since it requires training data
        // So we'll create a basic template structure
        await this.saveMetadataBasedTemplate(
          businessId,
          agent,
          templateOptions,
          title,
          descriptionText,
          imageUrl
        );

        logger.info(
          { businessId, occasion, imageUrl },
          "Generated metadata-based template with AI image"
        );
      } catch (error: any) {
        logger.error(
          { businessId, occasion, error: error.message },
          "Failed to generate metadata-based template with image"
        );
      }
    }
  }

  /**
   * Build description from agent metadata
   */
  private static buildMetadataDescription(
    occasion: string,
    category?: string,
    subCategories?: string[],
    tags?: string[],
    description?: string,
    holiday?: string
  ): string {
    const parts: string[] = [];

    if (occasion === "general") {
      parts.push("Discover amazing value with our exclusive offer!");
    } else if (occasion === "seasonal") {
      parts.push("Celebrate the season with our special limited-time offer!");
    } else if (occasion === "trending") {
      parts.push("Join the trend! Everyone's talking about this amazing deal!");
    } else if (occasion === "holiday" && holiday) {
      parts.push(`Celebrate ${holiday} with our special offer!`);
    } else if (occasion.includes("monday")) {
      parts.push("Start your week strong with our Monday Motivation special!");
    } else if (occasion.includes("tuesday")) {
      parts.push("Double the value this Tuesday with our special offer!");
    } else if (occasion.includes("wednesday")) {
      parts.push("Beat the midweek slump with our Wednesday special!");
    } else if (occasion.includes("thursday")) {
      parts.push("Throwback to great deals this Thursday!");
    } else if (occasion.includes("friday")) {
      parts.push("Kick off your weekend with our Friday special!");
    } else if (occasion.includes("saturday")) {
      parts.push("Make your Saturday special with our exclusive offer!");
    } else if (occasion.includes("sunday")) {
      parts.push("Treat yourself this Sunday with our self-care special!");
    }

    if (category) {
      parts.push(`Perfect for ${category.toLowerCase()} enthusiasts.`);
    }

    if (subCategories && subCategories.length > 0) {
      parts.push(
        `Specializing in ${subCategories.slice(0, 2).join(" and ").toLowerCase()}.`
      );
    }

    if (tags && tags.length > 0) {
      parts.push(`Featuring ${tags.slice(0, 3).join(", ").toLowerCase()}.`);
    }

    if (description) {
      // Take first sentence of description if available
      const firstSentence = description.split(".")[0];
      if (firstSentence && firstSentence.length < 150) {
        parts.push(firstSentence + ".");
      }
    }

    parts.push("Don't miss this opportunity to experience quality and value!");

    return parts.join(" ");
  }

  /**
   * Build the subject context for the image prompt from the business's own
   * training answers. Returns a theme ANCHOR (what kind of place it is, e.g.
   * "a Japanese sushi restaurant") kept separate from the menu items and
   * beverage program — so the anchor keeps every image on-theme while the
   * featured composition still varies per occasion/promotion (see
   * buildFeaturedPresentation). Anchoring on the cuisine rather than a fixed
   * item list avoids both off-theme stock food AND identical images.
   */
  private static buildSubjectContext(
    responseMap: Map<string, any>,
    subCategories?: string[]
  ): { visualSubject?: string; menuItems?: string[]; beverageProgram?: string } {
    const toParts = (v: any): string[] =>
      (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [])
        .map((s) => String(s).trim())
        .filter(Boolean);

    const dedupe = (parts: string[]): string[] => {
      const seen = new Set<string>();
      return parts
        .map((p) => p.trim())
        .filter((p) => {
          const key = p.toLowerCase();
          if (!p || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 8);
    };

    // Items the business can showcase (food + signature offerings).
    const menuItems = dedupe([
      ...toParts(responseMap.get("menu_highlights")),
      ...toParts(responseMap.get("signature_products")),
      ...toParts(responseMap.get("products_sold")),
      ...toParts(responseMap.get("services_offered")),
    ]);

    const beverageProgramRaw = responseMap.get("drink_program");
    const beverageProgram =
      typeof beverageProgramRaw === "string" &&
      beverageProgramRaw &&
      !/no special|none/i.test(beverageProgramRaw)
        ? beverageProgramRaw
        : undefined;

    // Theme anchor — prefer cuisine, then any other "what kind of place" answer,
    // then the sub-category. This is the phrase every image is held to.
    const cuisine = toParts(responseMap.get("cuisine_type")).join(" ");
    const otherType = toParts(responseMap.get("venue_type")).join(" ");
    const subCat = subCategories?.[0]?.trim();

    let visualSubject: string | undefined;
    if (cuisine) {
      visualSubject = subCat
        ? `a ${cuisine} ${subCat.toLowerCase()}`.replace(/\s+/g, " ")
        : `authentic ${cuisine} cuisine`;
    } else if (otherType) {
      visualSubject = `a ${otherType.toLowerCase()}${subCat ? ` ${subCat.toLowerCase()}` : ""}`;
    } else if (subCat) {
      visualSubject = `a ${subCat.toLowerCase()}`;
    }

    return { visualSubject, menuItems, beverageProgram };
  }

  /**
   * Build an occasion/promotion-specific "featured composition" line so each
   * template image highlights something different (drinks for happy hour,
   * paired plates for BOGO, a single dish for free-item, etc.) while staying
   * within the theme anchor from buildSubjectContext.
   */
  private static buildFeaturedPresentation(
    occasion?: string,
    promotionType?: string,
    menuItems?: string[],
    beverageProgram?: string
  ): string | undefined {
    const items = (menuItems || []).filter(Boolean);
    // Rotate the featured item by occasion so different templates differ even
    // when the menu list is short.
    const order = [
      "general", "trending", "seasonal", "slow_period", "holiday",
      "monday_motivation", "wednesday_midweek", "thursday_throwback",
    ];
    const idx = Math.max(0, order.indexOf(occasion || ""));
    const pick = (n: number): string | undefined =>
      items.length ? items[((n % items.length) + items.length) % items.length] : undefined;

    const promo = (promotionType || "").toLowerCase();

    // Drink-led contexts → showcase the beverage program.
    if (promo.includes("happy hour")) {
      return beverageProgram
        ? `Center the composition on signature drinks and cocktails from the ${beverageProgram.toLowerCase()}, with a couple of small shareable plates alongside`
        : `Center the composition on signature drinks and cocktails, with a couple of small shareable plates alongside`;
    }

    // Paired contexts → two matching items.
    if (promo.includes("bogo") || occasion === "tuesday_twofer") {
      const a = pick(0);
      return `Show two matching plated dishes${a ? ` such as ${a}` : ""} side by side to suggest a pair`;
    }

    // Free-item / self-care → one hero dish plus a small bonus.
    if (promo.includes("free item") || occasion === "sunday_selfcare") {
      const a = pick(0);
      return `Show a single beautifully plated signature dish${a ? ` like ${a}` : ""} with a small complimentary treat beside it`;
    }

    // Family / Saturday → a generous shared spread.
    if (promo.includes("family") || occasion === "saturday_special") {
      return `Show a generous shared spread of several dishes on a group table`;
    }

    // Seasonal → seasonal ingredients and styling.
    if (occasion === "seasonal") {
      const a = pick(idx);
      return `Plate ${a || "a featured dish"} with fresh seasonal ingredients and seasonal table styling`;
    }

    // Default → rotate a single featured item for variety.
    const featured = pick(idx);
    return featured
      ? `Center the composition on ${featured}, elegantly plated`
      : `Center the composition on an elegant signature dish`;
  }

  /**
   * De-duplicate and format subject hints into a single concise phrase,
   * optionally led by the business sub-category for context.
   */
  private static formatVisualSubject(
    hints: string[],
    subCategories?: string[]
  ): string | undefined {
    const seen = new Set<string>();
    const unique = hints
      .map((h) => h.trim())
      .filter((h) => {
        const key = h.toLowerCase();
        if (!h || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);

    if (unique.length === 0) return undefined;

    const subCat = subCategories?.[0]?.trim();
    const lead = subCat ? `${subCat.toLowerCase()}: ` : "";
    return `${lead}${unique.join(", ")}`.slice(0, 200);
  }

  /**
   * Generate AI image for templates.
   * Accepts optional enriched context from a trained-agent template so the
   * image style, mood, and subject matter reflect the actual promotion.
   * Images remain GENERIC — no business names, logos, or specific text.
   */
  private static async generateGenericTemplateImage(
    businessId: string,
    title: string,
    category?: string,
    subCategories?: string[],
    occasion?: string,
    enrichedContext?: {
      industry?: string;
      visualSubject?: string;
      menuItems?: string[];
      beverageProgram?: string;
      promotionType?: string;
      contentType?: string;
      targetAudience?: string[];
      brandVoice?: string[];
    }
  ): Promise<string> {
    try {
      const promptParts: string[] = [];

      // ── PRIMARY CONSTRAINT — text-free imagery (placed first for max weight)
      promptParts.push(
        "IMPORTANT: produce a purely visual, text-free image. Absolutely NO text, NO letters, NO numbers, NO digits, NO percentage signs, NO dollar signs, NO words, NO captions, NO logos, NO typography of any kind"
      );

      // ── Occasion mood ────────────────────────────────────────────────────
      const occasionMoods: Record<string, string> = {
        holiday: "festive, celebratory, warm-toned promotional image",
        seasonal: "seasonal, nature-inspired promotional image",
        trending: "modern, dynamic, high-energy promotional image with bold colours",
        slow_period: "calm, inviting, value-focused promotional image",
        monday_motivation: "energising, bright, motivational promotional image",
        tuesday_twofer: "playful, social, duo-themed promotional image",
        wednesday_midweek: "uplifting, mid-week treat promotional image",
        thursday_throwback: "nostalgic, vintage-inspired promotional image",
        friday_deals: "vibrant, exciting, weekend-ready promotional image",
        saturday_special: "warm, family-friendly, lively promotional image",
        sunday_selfcare: "calm, spa-like, soft-toned self-care promotional image",
      };
      const mood = occasionMoods[occasion || ""] || "professional promotional image";

      // ── Subject matter ───────────────────────────────────────────────────
      // Prefer a concrete subject built from the business's own offerings
      // (e.g. "restaurant: Japanese, sushi, ramen bowl"). Without it the prompt
      // fell back to a generic "<industry> theme", which produced unrelated
      // stock food (burgers, turkey) for a sushi restaurant.
      const visualSubject = enrichedContext?.visualSubject?.trim();
      if (visualSubject) {
        promptParts.push(`Create a ${mood} for ${visualSubject}`);

        // Occasion/promotion-specific hero composition keeps each image distinct.
        const featured = this.buildFeaturedPresentation(
          occasion,
          enrichedContext?.promotionType,
          enrichedContext?.menuItems,
          enrichedContext?.beverageProgram
        );
        if (featured) promptParts.push(featured);

        // Hold the image to the cuisine/theme, but explicitly invite variety so
        // images for different occasions don't all look identical.
        promptParts.push(
          `Keep all food and drink authentic to ${visualSubject}, but vary the exact dishes, plating, garnishes, props, table setting, lighting, camera angle and background so this image is clearly distinct from other promotional images for the same business`
        );
      } else {
        promptParts.push(`Create a ${mood}`);

        const industry = enrichedContext?.industry || category;
        if (industry) {
          promptParts.push(`Visual subject: ${industry.toLowerCase()} theme`);
        }

        if (subCategories && subCategories.length > 0) {
          promptParts.push(
            `Include elements of ${subCategories.slice(0, 2).join(" and ").toLowerCase()}`
          );
        }
      }

      // ── Promotion-type visual cues ────────────────────────────────────────
      // Cues use object/scene metaphors only — avoid words like "percentage",
      // "discount", or "currency" which trigger the model to render numerals
      // and symbols.
      if (enrichedContext?.promotionType) {
        const promoVisuals: Record<string, string> = {
          percentage_off: "Show a value and savings mood through visual metaphors — gift tags, ribbons, radial burst patterns, or shopping bag imagery (no numerals or symbols)",
          dollar_off:     "Show a value mood through visual metaphors — coin stacks, wallet, or price-tag shapes (no numerals or symbols)",
          bogo:           "Show two paired or mirrored items in the composition (no numerals or symbols)",
          free_item:      "Show a wrapped gift box with a ribbon, or a bonus item flourish (no numerals or symbols)",
        };
        const cue = promoVisuals[enrichedContext.promotionType];
        if (cue) promptParts.push(cue);
      }

      // ── Content type influences overall mood ─────────────────────────────
      if (enrichedContext?.contentType === "event") {
        promptParts.push("Convey a social, event atmosphere with crowd energy");
      } else if (enrichedContext?.contentType === "reward") {
        promptParts.push("Convey a sense of achievement and reward");
      }

      // ── Brand voice colour palette hints ─────────────────────────────────
      if (enrichedContext?.brandVoice && enrichedContext.brandVoice.length > 0) {
        const voice = enrichedContext.brandVoice.join(", ").toLowerCase();
        if (voice.includes("luxury") || voice.includes("premium")) {
          promptParts.push("Use a premium colour palette — deep navy, gold, or ivory tones");
        } else if (voice.includes("fun") || voice.includes("playful")) {
          promptParts.push("Use bright, playful colours — yellow, coral, or turquoise accents");
        } else if (voice.includes("professional") || voice.includes("corporate")) {
          promptParts.push("Use clean, professional colours — blue, white, and grey");
        }
      }

      // ── Mandatory generic constraints ────────────────────────────────────
      promptParts.push("Use vibrant colours and professional graphic-design composition");
      promptParts.push("Suitable for social media and promotional marketing use");
      // Final reinforcement — last instructions also carry strong weight.
      promptParts.push(
        "FINAL REMINDER: zero text, zero letters, zero numerals, zero typography, zero symbols. The image must be entirely free of any written or printed characters in any language"
      );

      const genericPrompt = promptParts.join(". ");

      logger.info(
        {
          businessId,
          occasion,
          industry: enrichedContext?.industry || category,
          visualSubject,
          promotionType: enrichedContext?.promotionType,
        },
        "Generating AI image for template"
      );

      const result = await ImageGenerationService.generateImage({
        businessId,
        prompt: genericPrompt,
        contentType: (enrichedContext?.contentType as any) || "offer",
        style: "professional",
        aspectRatio: "1:1",
      });

      return result.imageUrl;
    } catch (error: any) {
      logger.error(
        { businessId, error: error.message },
        "Failed to generate AI image, using default thumbnail"
      );

      return this.getDefaultThumbnail(occasion);
    }
  }

  /**
   * Save metadata-based template to database
   */
  private static async saveMetadataBasedTemplate(
    businessId: string,
    agent: any,
    options: TemplateGenerationOptions,
    title: string,
    _description: string,
    imageUrl: string
  ): Promise<any> {
    const { upsertTemplate, TemplateCreatorType, TemplateType, TemplateScope } =
      await import("../models/pinntagBackend/dealTemplate.model.js");

    const nextUpdate = new Date();
    nextUpdate.setHours(nextUpdate.getHours() + 24);

    // Helper function to ensure we have a valid ObjectId
    const toObjectId = (value: any): mongoose.Types.ObjectId => {
      if (value instanceof mongoose.Types.ObjectId) {
        return value;
      }
      return new mongoose.Types.ObjectId(value);
    };

    const businessObjectId = toObjectId(businessId);

    // Determine promotion fields based on occasion
    const isBogo = options.occasion === "tuesday_twofer";
    const discountType = isBogo ? DiscountType.BOGO : DiscountType.Percentage;
    const percentOffValue = isBogo ? undefined : 15;
    const bogoOrFreeItem = isBogo ? "Buy one, get one at equal or lesser value" : undefined;

    // Generate tags from title and occasion
    const generatedTags = this.generateTagsForTemplate(
      options.occasion || "general",
      title,
      "",
      agent.tags || []
    );

    // Note: businessCategories are not populated for metadata-based templates
    // because agent.subCategories contains category names (strings), not ObjectIds.
    // The businessCategories field will be populated by dealTemplateGenerator.service.ts
    // when the business has proper category mappings from the Pinntag backend.

    return upsertTemplate(
      {
        title,
        type: TemplateType.OFFER,
        businessId: businessObjectId as any,
      },
      {
        creatorType: TemplateCreatorType.SYSTEM,
        type: TemplateType.OFFER,
        scope: TemplateScope.BUSINESS_SPECIFIC,
        businessId: businessObjectId as any,
        title,
        thumbnail: imageUrl,
        tags: generatedTags,
        businessCategories: [], // Empty for metadata-based templates
        keywords: this.extractKeywords(title, ""),
        discountValue: "15",
        discountType,
        contentType: "offer",
        percentOffValue,
        bogoOrFreeItem,
        minTargetAge: 18,
        maxTargetAge: 65,
        targetGenders: ["male", "female", "others"],
        promotionCode: this.generatePromotionCode(title, options.occasion),
        isFree: false,
        termsApplied: true,
        termsAndConditions:
          "Valid on selected items only. Standard terms and conditions apply. Management reserves the right to modify or cancel this offer at any time.",
        generatedByAI: true,
        aiGenerationData: {
          occasion: options.occasion,
        } as any,
        isActive: true,
        lastUpdated: new Date(),
        nextScheduledUpdate: nextUpdate,
      }
    );
  }

  /**
   * Helper: Generate tags for template based on occasion, title, description, and agent tags
   */
  private static generateTagsForTemplate(
    occasion: string,
    title: string,
    description: string,
    agentTags: string[]
  ): string[] {
    const baseTags: string[] = [];

    // Add occasion-based tags
    const occasionTags: Record<string, string[]> = {
      holiday: ["holiday", "celebration", "festive", "seasonal"],
      seasonal: ["seasonal", "limited-time", "special"],
      slow_period: ["off-peak", "value", "savings", "budget-friendly"],
      trending: ["trending", "popular", "viral", "must-try"],
      general: ["deal", "offer", "savings", "discount"],
      monday_motivation: ["monday", "motivation", "start-of-week", "energy"],
      tuesday_twofer: ["tuesday", "bogo", "two-for-one", "sharing"],
      wednesday_midweek: ["wednesday", "midweek", "hump-day", "treat"],
      thursday_throwback: ["thursday", "throwback", "classic", "nostalgia"],
      friday_deals: ["friday", "weekend", "tgif", "celebration"],
      saturday_special: ["saturday", "weekend", "family", "friends"],
      sunday_selfcare: ["sunday", "self-care", "relaxation", "wellness"],
    };

    baseTags.push(...(occasionTags[occasion] || occasionTags.general));

    // Add agent tags
    if (agentTags && agentTags.length > 0) {
      baseTags.push(...agentTags.slice(0, 3));
    }

    // Extract key words from title
    const titleWords = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 3);
    baseTags.push(...titleWords);

    // Extract key words from description
    const descWords = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 2);
    baseTags.push(...descWords);

    // Remove duplicates and return
    return [...new Set(baseTags)].slice(0, 10);
  }

  /**
   * Helper: Extract keywords from title and description
   */
  private static extractKeywords(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const commonWords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "as",
      "is",
      "was",
      "are",
      "were",
      "be",
      "this",
      "that",
      "these",
      "those",
      "your",
      "our",
      "all",
    ]);

    const words = text
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !commonWords.has(word));

    return Array.from(new Set(words)).slice(0, 8);
  }

  /**
   * Helper: Generate promotion code
   */
  private static generatePromotionCode(title: string, occasion?: string): string {
    const prefix = occasion ? occasion.substring(0, 4).toUpperCase() : "SAVE";

    const titlePart = title
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 6)
      .toUpperCase();

    return `${prefix}${titlePart}`;
  }

  /**
   * Helper: Get default thumbnail based on occasion
   */
  private static getDefaultThumbnail(_occasion?: string): string {
    return "https://media-staging.pinntag.com/staging/Frame-1707479945-1771500682146.png";
  }
}
