import { logger } from "../utils/logger.js";
import { AI_TrainingModel } from "../models/AI_Training.model.js";
import { BusinessAIAssistantModel } from "../models/businessAIAssistant.model.js";
import { DealTemplateGeneratorService, TemplateGenerationOptions } from "../api/services/dealTemplateGenerator.service.js";
import { GeminiService } from "../api/services/gemini.service.js";
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

    // Generate templates with images
    for (const occasion of occasions) {
      try {
        // Generate the template content first
        const template = await DealTemplateGeneratorService.generateDealTemplate(
          businessId,
          occasion
        );

        // Generate AI image with GENERIC content
        const imageUrl = await this.generateGenericTemplateImage(
          businessId,
          template.title,
          template.description,
          agent.category,
          agent.subCategories,
          occasion.occasion
        );

        // Save template with generated image
        await DealTemplateGeneratorService.generateAndSaveDealTemplate(
          businessId,
          {
            ...occasion,
            thumbnailUrl: imageUrl,
          }
        );

        logger.info(
          { businessId, occasion: occasion.occasion, imageUrl },
          "Generated template with AI image for trained agent"
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
        // Generate AI image with GENERIC content
        const imageUrl = await this.generateGenericTemplateImage(
          businessId,
          title,
          descriptionText,
          category,
          subCategories,
          occasion
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
   * Generate AI image with GENERIC content for templates
   * Images should have generic visuals, no specific business names or details
   */
  private static async generateGenericTemplateImage(
    businessId: string,
    title: string,
    description: string,
    category?: string,
    subCategories?: string[],
    occasion?: string
  ): Promise<string> {
    try {
      // Build a GENERIC prompt that doesn't include specific business details
      const promptParts: string[] = [];

      // Add occasion-specific visual guidance
      if (occasion === "holiday") {
        promptParts.push("Create a festive, celebratory promotional image");
      } else if (occasion === "seasonal") {
        promptParts.push("Create a seasonal promotional image");
      } else if (occasion === "trending") {
        promptParts.push("Create a modern, trendy promotional image with dynamic energy");
      } else if (occasion === "slow_period") {
        promptParts.push("Create a value-focused promotional image");
      } else {
        promptParts.push("Create a professional promotional image");
      }

      // Add generic category context (not specific business)
      if (category) {
        promptParts.push(`Related to ${category.toLowerCase()} industry`);
      }

      // Add generic subcategory elements
      if (subCategories && subCategories.length > 0) {
        promptParts.push(
          `Featuring elements of ${subCategories.slice(0, 2).join(" and ").toLowerCase()}`
        );
      }

      // Add generic visual instructions
      promptParts.push("Use vibrant colors and professional design");
      promptParts.push("Create an eye-catching layout suitable for marketing");
      promptParts.push("Include abstract shapes or patterns, no specific text or business names");
      promptParts.push("Make it suitable for social media and promotional use");
      promptParts.push("Keep the content GENERIC and broadly applicable");
      promptParts.push("NO text, NO logos, NO specific business information");

      const genericPrompt = promptParts.join(". ");

      logger.info(
        { businessId, occasion, category },
        "Generating generic AI image for template"
      );

      // Generate the image using Gemini service
      const result = await GeminiService.generateImage({
        businessId,
        prompt: genericPrompt,
        contentType: "offer",
        style: "professional",
        aspectRatio: "1:1",
      });

      return result.imageUrl;
    } catch (error: any) {
      logger.error(
        { businessId, error: error.message },
        "Failed to generate generic AI image, using default thumbnail"
      );

      // Fallback to default thumbnail if image generation fails
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
    description: string,
    imageUrl: string
  ): Promise<void> {
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

    // Generate tags from title, description, and occasion
    const generatedTags = this.generateTagsForTemplate(
      options.occasion || "general",
      title,
      description,
      agent.tags || []
    );

    // Note: businessCategories are not populated for metadata-based templates
    // because agent.subCategories contains category names (strings), not ObjectIds.
    // The businessCategories field will be populated by dealTemplateGenerator.service.ts
    // when the business has proper category mappings from the Pinntag backend.

    await upsertTemplate(
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
        description,
        thumbnail: imageUrl,
        tags: generatedTags,
        businessCategories: [], // Empty for metadata-based templates
        keywords: this.extractKeywords(title, description),
        discountValue: "15",
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
