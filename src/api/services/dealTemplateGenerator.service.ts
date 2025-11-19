import { AI_TrainingModel } from "../../models/AI_Training.model.js";
import { BusinessAIAssistantModel } from "../../models/businessAIAssistant.model.js";
import { logger } from "../../utils/logger.js";
import mongoose from "mongoose";
import {
  getDealTemplateModel,
  IDealTemplate,
  TemplateCreatorType,
  TemplateType,
  TemplateScope,
  upsertTemplate,
} from "../../models/pinntagBackend/dealTemplate.model.js";

/**
 * Deal Template Generator Service
 * Generates deal/offer templates based on business training data
 */

export interface DealTemplate {
  title: string;
  description: string;
  suggestedDiscount: string;
  targetAudience: string[];
  bestTiming: {
    days: string[];
    hours: string[];
    seasonalNote?: string;
  };
  callToAction: string;
  marketingTips: string[];
}

export interface TemplateGenerationOptions {
  occasion?: "holiday" | "seasonal" | "slow_period" | "general" | "trending";
  specificHoliday?: string;
  promotionalGoal?: string;
  // Database template options
  saveToDatabase?: boolean;
  scope?: "generic" | "business_specific"; // Template scope
  categories?: string[];
  businessIndustryId?: string;
  businessCategoryIds?: string[];
  thumbnailUrl?: string;
}

export class DealTemplateGeneratorService {
  /**
   * Generates a deal template based on business training data
   */
  static async generateDealTemplate(
    businessId: string,
    options: TemplateGenerationOptions = {}
  ): Promise<DealTemplate> {
    try {
      // Get training data
      const training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!training || training.trainingStatus !== "completed") {
        throw new Error("Business training must be completed before generating templates");
      }

      // Get business info
      const businessAgent = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!businessAgent) {
        throw new Error(`No AI agent found for business ID: ${businessId}`);
      }

      // Convert responses to map for easy access
      const responseMap = new Map(
        training.responses.map((r) => [r.questionId, r.answer])
      );

      // Extract key data
      const businessName = businessAgent.businessName;
      const targetAudience = (responseMap.get("target_audience") as string[]) || [];
      const discountRange = (responseMap.get("typical_discount_range") as string) || "10-20%";
      const slowPeriods = (responseMap.get("slow_periods") as string[]) || [];
      const busiestDays = (responseMap.get("busiest_days") as string[]) || [];
      const marketingGoals = (responseMap.get("marketing_goals") as string[]) || [];
      const brandVoice = (responseMap.get("brand_voice") as string[]) || [];
      const industry = training.industry;

      // Generate template based on occasion
      const template = this.createTemplate(
        businessName,
        industry,
        targetAudience,
        discountRange,
        slowPeriods,
        busiestDays,
        marketingGoals,
        brandVoice,
        responseMap,
        options
      );

      logger.info({ businessId, occasion: options.occasion }, "Deal template generated");

      return template;
    } catch (error: any) {
      logger.error({ error, businessId }, "Error generating deal template");
      throw error;
    }
  }

  /**
   * Generates multiple deal templates at once
   */
  static async generateMultipleTemplates(
    businessId: string,
    occasions: TemplateGenerationOptions[]
  ): Promise<DealTemplate[]> {
    try {
      const templates = await Promise.all(
        occasions.map((options) => this.generateDealTemplate(businessId, options))
      );

      return templates;
    } catch (error: any) {
      logger.error({ error, businessId }, "Error generating multiple templates");
      throw error;
    }
  }

  /**
   * Generates and saves a deal template to the database
   */
  static async generateAndSaveDealTemplate(
    businessId: string,
    options: TemplateGenerationOptions = {}
  ): Promise<IDealTemplate> {
    try {
      // Generate the template content
      const template = await this.generateDealTemplate(businessId, options);

      // Get business info for additional metadata
      const businessAgent = await BusinessAIAssistantModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      if (!businessAgent) {
        throw new Error(`No AI agent found for business ID: ${businessId}`);
      }

      const training = await AI_TrainingModel.findOne({
        businessId: new mongoose.Types.ObjectId(businessId),
      });

      // Convert to database format
      const dbTemplate = this.convertToDatabaseFormat(
        template,
        businessAgent,
        training,
        options
      );

      // Calculate next update time (24 hours from now)
      const nextUpdate = new Date();
      nextUpdate.setHours(nextUpdate.getHours() + 24);

      // Save to database
      const savedTemplate = await upsertTemplate(
        {
          title: dbTemplate.title,
          type: dbTemplate.type,
          businessIndustry: dbTemplate.businessIndustry,
        },
        {
          ...dbTemplate,
          nextScheduledUpdate: nextUpdate,
        }
      );

      logger.info(
        { businessId, templateId: savedTemplate._id, occasion: options.occasion },
        "Deal template generated and saved to database"
      );

      return savedTemplate;
    } catch (error: any) {
      logger.error({ error, businessId }, "Error generating and saving deal template");
      throw error;
    }
  }

  /**
   * Generates and saves multiple templates for overnight batch processing
   */
  static async generateAndSaveMultipleTemplates(
    businessId: string,
    occasions: TemplateGenerationOptions[]
  ): Promise<IDealTemplate[]> {
    try {
      const templates = await Promise.all(
        occasions.map((options) =>
          this.generateAndSaveDealTemplate(businessId, { ...options, saveToDatabase: true })
        )
      );

      logger.info(
        { businessId, count: templates.length },
        "Multiple templates generated and saved"
      );

      return templates;
    } catch (error: any) {
      logger.error({ error, businessId }, "Error generating multiple templates");
      throw error;
    }
  }

  /**
   * Generates generic templates for an industry
   * Generic templates are generated from a sample business but made generic
   */
  static async generateGenericTemplatesForIndustry(
    industryId: string,
    occasions: TemplateGenerationOptions[]
  ): Promise<IDealTemplate[]> {
    try {
      // Find a sample trained business in this industry to base templates on
      const sampleTraining = await AI_TrainingModel.findOne({
        industry: new mongoose.Types.ObjectId(industryId),
        trainingStatus: "completed",
      });

      if (!sampleTraining) {
        throw new Error(`No trained businesses found for industry ID: ${industryId}`);
      }

      logger.info(
        { industryId, sampleBusinessId: sampleTraining.businessId },
        "Generating generic templates for industry"
      );

      // Generate templates with generic scope
      const templates = await Promise.all(
        occasions.map((options) =>
          this.generateAndSaveDealTemplate(sampleTraining.businessId.toString(), {
            ...options,
            scope: "generic",
            businessIndustryId: industryId,
            saveToDatabase: true,
          })
        )
      );

      logger.info(
        { industryId, count: templates.length },
        "Generic templates generated for industry"
      );

      return templates;
    } catch (error: any) {
      logger.error({ error, industryId }, "Error generating generic templates");
      throw error;
    }
  }

  /**
   * Converts a DealTemplate to database-compatible IDealTemplate format
   */
  private static convertToDatabaseFormat(
    template: DealTemplate,
    businessAgent: any,
    training: any,
    options: TemplateGenerationOptions
  ): Partial<IDealTemplate> {
    // Extract discount value from suggestedDiscount (e.g., "10-20%" -> "15")
    const discountValue = this.extractDiscountNumber(template.suggestedDiscount);

    // Map target audience to genders
    const targetGenders = this.mapTargetAudienceToGenders(template.targetAudience);

    // Generate keywords from title and description
    const keywords = this.extractKeywords(template.title, template.description);

    // Generate promotion code
    const promotionCode = this.generatePromotionCode(template.title, options.occasion);

    // Determine template scope
    const scope = options.scope || TemplateScope.BUSINESS_SPECIFIC;
    const isGeneric = scope === TemplateScope.GENERIC;

    return {
      creatorType: TemplateCreatorType.SYSTEM,
      type: TemplateType.OFFER,
      scope,
      businessId: isGeneric ? undefined : (new mongoose.Types.ObjectId(businessAgent.businessId) as any),
      discountValue,
      categories: options.categories?.map(c => new mongoose.Types.ObjectId(c) as any) || [],
      title: isGeneric
        ? this.makeGenericTitle(template.title, training?.industry)
        : template.title,
      keywords,
      description: isGeneric
        ? this.makeGenericDescription(template.description, businessAgent.businessName)
        : template.description,
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders,
      promotionCode: isGeneric ? this.generatePromotionCode(template.title, options.occasion, true) : promotionCode,
      isFree: false,
      participationCost: "",
      termsApplied: true,
      termsAndConditions: "Valid on selected items only. Terms and conditions apply.",
      businessIndustry: options.businessIndustryId
        ? (new mongoose.Types.ObjectId(options.businessIndustryId) as any)
        : training?.industry
        ? (new mongoose.Types.ObjectId(training.industry) as any)
        : undefined,
      businessCategories:
        options.businessCategoryIds?.map(c => new mongoose.Types.ObjectId(c) as any) || [],
      thumbnail: options.thumbnailUrl || this.getDefaultThumbnail(options.occasion),
      generatedByAI: true,
      aiGenerationData: {
        occasion: options.occasion,
        specificHoliday: options.specificHoliday,
        promotionalGoal: options.promotionalGoal,
        bestTiming: template.bestTiming,
        callToAction: template.callToAction,
        marketingTips: template.marketingTips,
      },
      isActive: true,
      lastUpdated: new Date(),
    };
  }

  /**
   * Helper: Map target audience to gender array
   */
  private static mapTargetAudienceToGenders(targetAudience: string[]): string[] {
    const audienceLower = targetAudience.join(" ").toLowerCase();

    if (audienceLower.includes("all") || audienceLower.includes("everyone")) {
      return ["male", "female", "others"];
    }

    const genders: string[] = [];
    if (audienceLower.includes("male") || audienceLower.includes("men")) {
      genders.push("male");
    }
    if (audienceLower.includes("female") || audienceLower.includes("women")) {
      genders.push("female");
    }

    // Default to all if no specific gender found
    return genders.length > 0 ? genders : ["male", "female", "others"];
  }

  /**
   * Helper: Extract keywords from title and description
   */
  private static extractKeywords(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const commonWords = new Set([
      "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
      "this", "that", "these", "those", "your", "our", "all"
    ]);

    const words = text
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    // Get unique words and take top 5-10
    return Array.from(new Set(words)).slice(0, 8);
  }

  /**
   * Helper: Generate promotion code
   */
  private static generatePromotionCode(title: string, occasion?: string, isGeneric = false): string {
    const prefix = occasion
      ? occasion.substring(0, 4).toUpperCase()
      : "SAVE";

    const titlePart = title
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 6)
      .toUpperCase();

    // For generic templates, add GENERIC suffix to prevent code conflicts
    const suffix = isGeneric ? "GEN" : "";

    return `${prefix}${titlePart}${suffix}`;
  }

  /**
   * Helper: Make title generic (remove business-specific references)
   */
  private static makeGenericTitle(title: string, industry?: string): string {
    // Remove specific business names and make it industry-generic
    // This is a simple implementation - could be enhanced with NLP
    const genericTitle = title
      .replace(/at\s+[A-Z][a-zA-Z\s]+!/gi, "!") // Remove "at BusinessName!"
      .replace(/\s+at\s+.+$/, "") // Remove trailing "at BusinessName"
      .trim();

    return genericTitle || title;
  }

  /**
   * Helper: Make description generic (remove business-specific references)
   */
  private static makeGenericDescription(description: string, businessName?: string): string {
    // Replace business name with generic placeholder
    let genericDesc = description;

    if (businessName) {
      const namePattern = new RegExp(businessName, "gi");
      genericDesc = genericDesc.replace(namePattern, "us");
    }

    // Remove specific possessive references
    genericDesc = genericDesc
      .replace(/Visit us today/gi, "Visit today")
      .replace(/our premium/gi, "premium")
      .trim();

    return genericDesc || description;
  }

  /**
   * Helper: Get default thumbnail based on occasion
   */
  private static getDefaultThumbnail(occasion?: string): string {
    const baseUrl = "https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/";

    const thumbnails: Record<string, string> = {
      holiday: `${baseUrl}Holiday_Special.jpg`,
      seasonal: `${baseUrl}Seasonal_Sale.jpg`,
      slow_period: `${baseUrl}Off_Peak_Deal.jpg`,
      trending: `${baseUrl}Trending_Now.jpg`,
      general: `${baseUrl}Special_Offer.jpg`,
    };

    return thumbnails[occasion || "general"] || thumbnails.general;
  }

  /**
   * Creates a deal template with appropriate content
   */
  private static createTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    slowPeriods: string[],
    busiestDays: string[],
    marketingGoals: string[],
    brandVoice: string[],
    responseMap: Map<string, any>,
    options: TemplateGenerationOptions
  ): DealTemplate {
    const { occasion = "general", specificHoliday } = options;

    // Determine suggested days (inverse of busiest days for slow period deals)
    const suggestedDays =
      occasion === "slow_period"
        ? this.getSlowDays(busiestDays)
        : busiestDays.length > 0
        ? busiestDays
        : ["All days"];

    // Determine suggested hours based on slow periods
    const suggestedHours = this.extractHoursFromSlowPeriods(slowPeriods);

    // Generate content based on occasion
    let template: DealTemplate;

    switch (occasion) {
      case "holiday":
        template = this.createHolidayTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedDays,
          suggestedHours,
          specificHoliday,
          brandVoice
        );
        break;

      case "seasonal":
        template = this.createSeasonalTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedDays,
          suggestedHours,
          brandVoice,
          responseMap
        );
        break;

      case "slow_period":
        template = this.createSlowPeriodTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          slowPeriods,
          suggestedHours,
          brandVoice
        );
        break;

      case "trending":
        template = this.createTrendingTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedDays,
          suggestedHours,
          brandVoice
        );
        break;

      default:
        template = this.createGeneralTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedDays,
          suggestedHours,
          marketingGoals,
          brandVoice
        );
    }

    return template;
  }

  private static createHolidayTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedDays: string[],
    suggestedHours: string[],
    specificHoliday?: string,
    brandVoice: string[] = []
  ): DealTemplate {
    const holiday = specificHoliday || "the holiday season";
    const discount = this.extractDiscountNumber(discountRange);

    return {
      title: `${holiday} Special - Save ${discount}%!`,
      description: `Celebrate ${holiday} with us! Enjoy ${discount}% off and make this ${holiday} memorable. Perfect for ${targetAudience.join(" and ").toLowerCase()}.`,
      suggestedDiscount: discountRange,
      targetAudience,
      bestTiming: {
        days: suggestedDays,
        hours: suggestedHours,
        seasonalNote: `Best promoted 1-2 weeks before ${holiday}`,
      },
      callToAction: `Book now and celebrate ${holiday} with ${businessName}!`,
      marketingTips: [
        `Start promoting 1-2 weeks before ${holiday}`,
        "Use holiday-themed visuals and colors",
        "Emphasize limited-time nature of the offer",
        "Cross-promote on social media with holiday hashtags",
        "Consider gift card promotions for holiday gifting",
      ],
    };
  }

  private static createSeasonalTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedDays: string[],
    suggestedHours: string[],
    brandVoice: string[],
    responseMap: Map<string, any>
  ): DealTemplate {
    const discount = this.extractDiscountNumber(discountRange);
    const currentSeason = this.getCurrentSeason();

    return {
      title: `${currentSeason} Savings - ${discount}% Off`,
      description: `Welcome ${currentSeason.toLowerCase()} with our special offer! Get ${discount}% off and enjoy the best of the season at ${businessName}.`,
      suggestedDiscount: discountRange,
      targetAudience,
      bestTiming: {
        days: suggestedDays,
        hours: suggestedHours,
        seasonalNote: `Promote at the start of ${currentSeason.toLowerCase()}`,
      },
      callToAction: `Embrace ${currentSeason.toLowerCase()} - book your visit today!`,
      marketingTips: [
        `Use ${currentSeason.toLowerCase()}-themed imagery`,
        "Highlight seasonal products/services",
        "Create a sense of urgency with limited-time framing",
        "Consider bundling seasonal items",
        "Leverage weather-related messaging",
      ],
    };
  }

  private static createSlowPeriodTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    slowPeriods: string[],
    suggestedHours: string[],
    brandVoice: string[]
  ): DealTemplate {
    const discount = this.extractDiscountNumber(discountRange);
    const periodDesc = slowPeriods.length > 0 ? slowPeriods[0] : "weekday";

    return {
      title: `Beat the Rush - ${discount}% Off During Off-Peak Hours!`,
      description: `Skip the crowds and save! Visit us during ${periodDesc.toLowerCase()} and enjoy ${discount}% off. Experience the same great service with no wait.`,
      suggestedDiscount: discountRange,
      targetAudience: [...targetAudience, "Budget-conscious customers"],
      bestTiming: {
        days: this.getSlowDays([]),
        hours: suggestedHours,
        seasonalNote: "Focus on traditionally slow periods",
      },
      callToAction: `Save money and skip the wait - visit ${businessName} today!`,
      marketingTips: [
        "Emphasize convenience and time savings",
        "Highlight that quality/service remains the same",
        "Target price-sensitive customers",
        "Consider loyalty program tie-ins",
        "Use social proof with customer testimonials",
      ],
    };
  }

  private static createTrendingTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedDays: string[],
    suggestedHours: string[],
    brandVoice: string[]
  ): DealTemplate {
    const discount = this.extractDiscountNumber(discountRange);

    return {
      title: `Trending Now - Limited Time ${discount}% Off!`,
      description: `Join the trend! Everyone's talking about ${businessName}. Get ${discount}% off and see what the hype is all about.`,
      suggestedDiscount: discountRange,
      targetAudience,
      bestTiming: {
        days: suggestedDays,
        hours: suggestedHours,
        seasonalNote: "Leverage current social media trends and viral moments",
      },
      callToAction: "Don't miss out - experience the trend yourself!",
      marketingTips: [
        "Use trending hashtags and social media challenges",
        "Create shareable content for social media",
        "Encourage user-generated content",
        "Partner with local influencers",
        "Make it Instagram/TikTok worthy",
      ],
    };
  }

  private static createGeneralTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedDays: string[],
    suggestedHours: string[],
    marketingGoals: string[],
    brandVoice: string[]
  ): DealTemplate {
    const discount = this.extractDiscountNumber(discountRange);

    return {
      title: `Special Offer - Save ${discount}% at ${businessName}`,
      description: `Discover quality and value at ${businessName}! Enjoy ${discount}% off your visit. Perfect for ${targetAudience.join(", ").toLowerCase()}.`,
      suggestedDiscount: discountRange,
      targetAudience,
      bestTiming: {
        days: suggestedDays,
        hours: suggestedHours,
      },
      callToAction: `Visit ${businessName} today and save!`,
      marketingTips: [
        "Emphasize your unique value proposition",
        "Use customer testimonials and reviews",
        "Highlight what makes you different from competitors",
        "Create urgency with limited-time framing",
        "Follow up with customers after their visit",
      ],
    };
  }

  // Helper methods
  private static extractDiscountNumber(discountRange: string): string {
    // Extract the first number from discount range (e.g., "10-20%" -> "10")
    const match = discountRange.match(/\d+/);
    return match ? match[0] : "15";
  }

  private static getSlowDays(busiestDays: string[]): string[] {
    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const slowDays = allDays.filter((day) => !busiestDays.includes(day));
    return slowDays.length > 0 ? slowDays : ["Weekdays"];
  }

  private static extractHoursFromSlowPeriods(slowPeriods: string[]): string[] {
    const hours: string[] = [];

    for (const period of slowPeriods) {
      if (period.includes("morning")) hours.push("Morning (9-12 PM)");
      if (period.includes("afternoon")) hours.push("Afternoon (2-5 PM)");
      if (period.includes("evening")) hours.push("Evening (5-8 PM)");
    }

    return hours.length > 0 ? hours : ["All hours"];
  }

  private static getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "Spring";
    if (month >= 5 && month <= 7) return "Summer";
    if (month >= 8 && month <= 10) return "Fall";
    return "Winter";
  }
}
