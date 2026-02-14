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
import { openai } from "../../utils/openai.js";

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
  tags: string[];
  dealType: string;
  termsAndConditions: string;
  image: string;
}

// Day-specific occasion types
export type DaySpecificOccasion =
  | "monday_motivation"
  | "tuesday_twofer"
  | "wednesday_midweek"
  | "thursday_throwback"
  | "friday_deals"
  | "saturday_special"
  | "sunday_selfcare";

export type TemplateOccasion =
  | "holiday"
  | "seasonal"
  | "slow_period"
  | "general"
  | "trending"
  | DaySpecificOccasion;

export interface TemplateGenerationOptions {
  occasion?: TemplateOccasion;
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

      // Note: We don't auto-populate businessCategoryIds from agent.subCategories
      // because subCategories contains category names (strings), not ObjectIds.
      // businessCategoryIds should be passed explicitly as ObjectId strings if available.

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

    // Helper function to ensure we have a valid ObjectId
    const toObjectId = (value: any): mongoose.Types.ObjectId => {
      if (value instanceof mongoose.Types.ObjectId) {
        return value;
      }
      return new mongoose.Types.ObjectId(value);
    };

    return {
      creatorType: TemplateCreatorType.SYSTEM,
      type: template.dealType as TemplateType || TemplateType.OFFER,
      scope,
      businessId: isGeneric ? undefined : (toObjectId(businessAgent.businessId) as any),
      discountValue,
      categories: options.categories?.map(c => toObjectId(c) as any) || [],
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
      termsAndConditions: template.termsAndConditions,
      // businessIndustry: Only set if we have an actual ObjectId string
      // training.industry is an industry name (string), but the schema requires ObjectId
      // Leave undefined rather than risk casting error
      businessIndustry: options.businessIndustryId
        ? (toObjectId(options.businessIndustryId) as any)
        : undefined,
      businessCategories:
        options.businessCategoryIds?.map(c => toObjectId(c) as any) || [],
      thumbnail: options.thumbnailUrl || template.image,
      tags: template.tags,
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
      // Day-specific thumbnails
      monday_motivation: `${baseUrl}Monday_Motivation.jpg`,
      tuesday_twofer: `${baseUrl}Tuesday_Twofer.jpg`,
      wednesday_midweek: `${baseUrl}Wednesday_Midweek.jpg`,
      thursday_throwback: `${baseUrl}Thursday_Throwback.jpg`,
      friday_deals: `${baseUrl}Friday_Deals.jpg`,
      saturday_special: `${baseUrl}Saturday_Special.jpg`,
      sunday_selfcare: `${baseUrl}Sunday_Selfcare.jpg`,
    };

    return thumbnails[occasion || "general"] || thumbnails.general;
  }

  /**
   * Generates AI-powered title and description for a template
   */
  private static async generateAITitleAndDescription(params: {
    businessName: string;
    industry: string;
    occasion: TemplateOccasion;
    specificHoliday?: string;
    targetAudience: string[];
    discountRange: string;
    brandVoice?: string[];
    dealType: string;
  }): Promise<{ title: string; description: string }> {
    const {
      businessName,
      industry,
      occasion,
      specificHoliday,
      targetAudience,
      discountRange,
      brandVoice,
      dealType,
    } = params;

    try {
      const discount = this.extractDiscountNumber(discountRange);

      // Build context for AI generation
      const contextParts = [
        `Generate a compelling title and description for a ${dealType} template.`,
        `Business Name: ${businessName}`,
        `Industry: ${industry}`,
        `Occasion: ${occasion}`,
      ];

      if (specificHoliday) {
        contextParts.push(`Holiday: ${specificHoliday}`);
      }

      if (targetAudience.length > 0) {
        contextParts.push(`Target Audience: ${targetAudience.join(", ")}`);
      }

      contextParts.push(`Discount: ${discount}%`);

      if (brandVoice && brandVoice.length > 0) {
        contextParts.push(`Brand Voice: ${brandVoice.join(", ")}`);
      }

      // Add occasion-specific instructions
      const occasionInstructions: Record<string, string> = {
        holiday: `Create an exciting, festive title and description that captures the holiday spirit${specificHoliday ? ` for ${specificHoliday}` : ""}.`,
        seasonal: "Create a seasonally-relevant title and description that emphasizes timely savings.",
        slow_period: "Create a value-focused title and description that highlights off-peak convenience and savings.",
        trending: "Create a buzz-worthy, trendy title and description that creates FOMO and excitement.",
        general: "Create a professional, compelling title and description that highlights value.",
        monday_motivation: "Create an energizing, motivational title and description perfect for starting the week.",
        tuesday_twofer: "Create a fun, sharing-focused title and description that emphasizes the buy-one-get-one value.",
        wednesday_midweek: "Create a midweek treat-focused title and description that helps customers through the week.",
        thursday_throwback: "Create a nostalgic, classic-focused title and description leveraging the #TBT theme.",
        friday_deals: "Create an exciting, weekend-kickoff title and description that celebrates the end of the work week.",
        saturday_special: "Create a family/group-friendly title and description perfect for weekend activities.",
        sunday_selfcare: "Create a relaxing, self-care focused title and description for a restful Sunday.",
      };

      contextParts.push(occasionInstructions[occasion] || occasionInstructions.general);

      const prompt = `${contextParts.join("\n")}

Respond with ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "title": "Catchy, attention-grabbing title (max 60 chars) that includes the discount percentage",
  "description": "Engaging description (50-100 words) that creates excitement and clearly explains the offer"
}

IMPORTANT:
- The title MUST be concise (under 60 characters)
- The title MUST include the ${discount}% discount
- The description should mention ${businessName}
- The description should be compelling and create urgency
- Use the appropriate tone for ${occasion}
- Target the description to ${targetAudience.join(" and ").toLowerCase() || "general customers"}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional marketing copywriter specializing in promotional content. Generate compelling, concise titles and descriptions for business deals that drive customer engagement.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: "json_object" },
      });

      const responseContent = response.choices[0]?.message?.content?.trim();

      if (!responseContent) {
        throw new Error("No response from OpenAI");
      }

      const generated = JSON.parse(responseContent);

      if (!generated.title || !generated.description) {
        throw new Error("Invalid response format from OpenAI");
      }

      logger.info(
        { businessName, occasion, title: generated.title },
        "Generated AI title and description for template"
      );

      return {
        title: generated.title,
        description: generated.description,
      };
    } catch (error: any) {
      logger.warn(
        { error: error.message, businessName, occasion },
        "Failed to generate AI content, falling back to template-based content"
      );

      // Fallback to default title/description format if AI generation fails
      const discount = this.extractDiscountNumber(discountRange);
      return {
        title: `${specificHoliday || occasion} Special - Save ${discount}%!`,
        description: `Enjoy ${discount}% off at ${businessName}. Perfect for ${targetAudience.join(" and ").toLowerCase() || "everyone"}.`,
      };
    }
  }

  /**
   * Creates a deal template with appropriate content
   */
  private static async createTemplate(
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
  ): Promise<DealTemplate> {
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
        template = await this.createHolidayTemplate(
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
        template = await this.createSeasonalTemplate(
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
        template = await this.createSlowPeriodTemplate(
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
        template = await this.createTrendingTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedDays,
          suggestedHours,
          brandVoice
        );
        break;

      // Day-specific templates
      case "monday_motivation":
        template = await this.createMondayMotivationTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedHours,
          brandVoice
        );
        break;

      case "tuesday_twofer":
        template = await this.createTuesdayTwoferTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedHours,
          brandVoice
        );
        break;

      case "wednesday_midweek":
        template = await this.createWednesdayMidweekTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedHours,
          brandVoice
        );
        break;

      case "thursday_throwback":
        template = await this.createThursdayThrowbackTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedHours,
          brandVoice
        );
        break;

      case "friday_deals":
        template = await this.createFridayDealsTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedHours,
          brandVoice
        );
        break;

      case "saturday_special":
        template = await this.createSaturdaySpecialTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedHours,
          brandVoice
        );
        break;

      case "sunday_selfcare":
        template = await this.createSundaySelfcareTemplate(
          businessName,
          industry,
          targetAudience,
          discountRange,
          suggestedHours,
          brandVoice
        );
        break;

      default:
        template = await this.createGeneralTemplate(
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

  private static async createHolidayTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedDays: string[],
    suggestedHours: string[],
    specificHoliday?: string,
    brandVoice: string[] = []
  ): Promise<DealTemplate> {
    const holiday = specificHoliday || "the holiday season";
    const discount = this.extractDiscountNumber(discountRange);

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "holiday",
      specificHoliday: holiday,
      targetAudience,
      discountRange,
      brandVoice,
      dealType: "holiday offer",
    });

    return {
      title,
      description,
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
      tags: this.generateTags("holiday", title, targetAudience, [holiday.toLowerCase().replace(/\s+/g, "-")]),
      dealType: this.getDealType("holiday"),
      termsAndConditions: this.generateTermsAndConditions("holiday", discount),
      image: this.getDefaultThumbnail("holiday"),
    };
  }

  private static async createSeasonalTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedDays: string[],
    suggestedHours: string[],
    brandVoice: string[],
    _responseMap: Map<string, any>
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);
    const currentSeason = this.getCurrentSeason();

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "seasonal",
      specificHoliday: currentSeason,
      targetAudience,
      discountRange,
      brandVoice,
      dealType: "seasonal offer",
    });

    return {
      title,
      description,
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
      tags: this.generateTags("seasonal", title, targetAudience, [currentSeason.toLowerCase()]),
      dealType: this.getDealType("seasonal"),
      termsAndConditions: this.generateTermsAndConditions("seasonal", discount),
      image: this.getDefaultThumbnail("seasonal"),
    };
  }

  private static async createSlowPeriodTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    slowPeriods: string[],
    suggestedHours: string[],
    brandVoice: string[]
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);
    const periodDesc = slowPeriods.length > 0 ? slowPeriods[0] : "weekday";
    const extendedAudience = [...targetAudience, "Budget-conscious customers"];

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "slow_period",
      targetAudience: extendedAudience,
      discountRange,
      brandVoice,
      dealType: "off-peak special",
    });

    return {
      title,
      description,
      suggestedDiscount: discountRange,
      targetAudience: extendedAudience,
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
      tags: this.generateTags("slow_period", title, extendedAudience),
      dealType: this.getDealType("slow_period"),
      termsAndConditions: this.generateTermsAndConditions("slow_period", discount),
      image: this.getDefaultThumbnail("slow_period"),
    };
  }

  private static async createTrendingTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedDays: string[],
    suggestedHours: string[],
    brandVoice: string[]
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "trending",
      targetAudience,
      discountRange,
      brandVoice,
      dealType: "trending offer",
    });

    return {
      title,
      description,
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
      tags: this.generateTags("trending", title, targetAudience, ["viral", "hype"]),
      dealType: this.getDealType("trending"),
      termsAndConditions: this.generateTermsAndConditions("trending", discount),
      image: this.getDefaultThumbnail("trending"),
    };
  }

  private static async createGeneralTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedDays: string[],
    suggestedHours: string[],
    _marketingGoals: string[],
    brandVoice: string[]
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "general",
      targetAudience,
      discountRange,
      brandVoice,
      dealType: "special offer",
    });

    return {
      title,
      description,
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
      tags: this.generateTags("general", title, targetAudience),
      dealType: this.getDealType("general"),
      termsAndConditions: this.generateTermsAndConditions("general", discount),
      image: this.getDefaultThumbnail("general"),
    };
  }

  // Day-specific template creation methods
  private static async createMondayMotivationTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedHours: string[],
    brandVoice: string[] = []
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "monday_motivation",
      targetAudience,
      discountRange,
      brandVoice,
      dealType: "monday motivation offer",
    });

    return {
      title,
      description,
      suggestedDiscount: discountRange,
      targetAudience,
      bestTiming: {
        days: ["Monday"],
        hours: suggestedHours,
        seasonalNote: "Best for morning and lunch hours when people need motivation",
      },
      callToAction: `Beat the Monday blues - visit ${businessName} today!`,
      marketingTips: [
        "Focus on energizing, positive messaging",
        "Target professionals and students starting their week",
        "Promote through morning social media posts",
        "Partner with coffee/breakfast offerings if applicable",
        "Use motivational quotes and imagery",
      ],
      tags: this.generateTags("monday_motivation", title, targetAudience),
      dealType: this.getDealType("monday_motivation"),
      termsAndConditions: this.generateTermsAndConditions("monday_motivation", discount),
      image: this.getDefaultThumbnail("monday_motivation"),
    };
  }

  private static async createTuesdayTwoferTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedHours: string[],
    brandVoice: string[] = []
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);
    const extendedAudience = [...targetAudience, "Groups", "Friends", "Couples"];

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "tuesday_twofer",
      targetAudience: extendedAudience,
      discountRange,
      brandVoice,
      dealType: "two-for-tuesday offer",
    });

    return {
      title,
      description,
      suggestedDiscount: discountRange,
      targetAudience: extendedAudience,
      bestTiming: {
        days: ["Tuesday"],
        hours: suggestedHours,
        seasonalNote: "Great for lunch and after-work hours",
      },
      callToAction: `Bring a friend and save - visit ${businessName} this Tuesday!`,
      marketingTips: [
        "Emphasize sharing and social experiences",
        "Target groups, couples, and friends",
        "Create shareable social media content",
        "Consider referral bonuses",
        "Use pair/duo imagery in marketing",
      ],
      tags: this.generateTags("tuesday_twofer", title, extendedAudience),
      dealType: this.getDealType("tuesday_twofer"),
      termsAndConditions: this.generateTermsAndConditions("tuesday_twofer", discount),
      image: this.getDefaultThumbnail("tuesday_twofer"),
    };
  }

  private static async createWednesdayMidweekTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedHours: string[],
    brandVoice: string[] = []
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "wednesday_midweek",
      targetAudience,
      discountRange,
      brandVoice,
      dealType: "midweek special",
    });

    return {
      title,
      description,
      suggestedDiscount: discountRange,
      targetAudience,
      bestTiming: {
        days: ["Wednesday"],
        hours: suggestedHours,
        seasonalNote: "Target lunch breaks and after-work hours",
      },
      callToAction: `Break up your week - visit ${businessName} this Wednesday!`,
      marketingTips: [
        "Use 'hump day' messaging",
        "Emphasize treating yourself mid-week",
        "Target lunch crowds and after-work customers",
        "Create urgency with one-day-only framing",
        "Highlight stress relief and self-reward themes",
      ],
      tags: this.generateTags("wednesday_midweek", title, targetAudience),
      dealType: this.getDealType("wednesday_midweek"),
      termsAndConditions: this.generateTermsAndConditions("wednesday_midweek", discount),
      image: this.getDefaultThumbnail("wednesday_midweek"),
    };
  }

  private static async createThursdayThrowbackTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedHours: string[],
    brandVoice: string[] = []
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "thursday_throwback",
      targetAudience,
      discountRange,
      brandVoice,
      dealType: "throwback thursday deal",
    });

    return {
      title,
      description,
      suggestedDiscount: discountRange,
      targetAudience,
      bestTiming: {
        days: ["Thursday"],
        hours: suggestedHours,
        seasonalNote: "Leverage #TBT social media trend",
      },
      callToAction: `Relive the classics - visit ${businessName} this Thursday!`,
      marketingTips: [
        "Use #TBT and #ThrowbackThursday hashtags",
        "Feature classic/legacy products or services",
        "Share nostalgic content and old photos",
        "Appeal to long-time customers",
        "Create vintage-style marketing materials",
      ],
      tags: this.generateTags("thursday_throwback", title, targetAudience, ["tbt"]),
      dealType: this.getDealType("thursday_throwback"),
      termsAndConditions: this.generateTermsAndConditions("thursday_throwback", discount),
      image: this.getDefaultThumbnail("thursday_throwback"),
    };
  }

  private static async createFridayDealsTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedHours: string[],
    brandVoice: string[] = []
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);
    const extendedAudience = [...targetAudience, "Weekend planners", "Party-goers"];

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "friday_deals",
      targetAudience: extendedAudience,
      discountRange,
      brandVoice,
      dealType: "friday weekend kickoff deal",
    });

    return {
      title,
      description,
      suggestedDiscount: discountRange,
      targetAudience: extendedAudience,
      bestTiming: {
        days: ["Friday"],
        hours: suggestedHours.length > 0 ? suggestedHours : ["Afternoon (2-5 PM)", "Evening (5-8 PM)"],
        seasonalNote: "Peak times are lunch and after-work hours",
      },
      callToAction: `Kick off your weekend - visit ${businessName} this Friday!`,
      marketingTips: [
        "Create excitement around weekend plans",
        "Target after-work crowds",
        "Use celebratory, upbeat messaging",
        "Promote happy hour style deals",
        "Leverage TGIF sentiment in marketing",
        "Consider extended hours promotions",
      ],
      tags: this.generateTags("friday_deals", title, extendedAudience),
      dealType: this.getDealType("friday_deals"),
      termsAndConditions: this.generateTermsAndConditions("friday_deals", discount),
      image: this.getDefaultThumbnail("friday_deals"),
    };
  }

  private static async createSaturdaySpecialTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedHours: string[],
    brandVoice: string[] = []
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);
    const extendedAudience = [...targetAudience, "Families", "Groups", "Weekend shoppers"];

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "saturday_special",
      targetAudience: extendedAudience,
      discountRange,
      brandVoice,
      dealType: "saturday family special",
    });

    return {
      title,
      description,
      suggestedDiscount: discountRange,
      targetAudience: extendedAudience,
      bestTiming: {
        days: ["Saturday"],
        hours: suggestedHours.length > 0 ? suggestedHours : ["Morning (9-12 PM)", "Afternoon (2-5 PM)"],
        seasonalNote: "Target families and groups during peak weekend hours",
      },
      callToAction: `Make it a Saturday to remember - visit ${businessName}!`,
      marketingTips: [
        "Target families and larger groups",
        "Emphasize quality time together",
        "Offer group/family packages",
        "Create Instagram-worthy experiences",
        "Consider kid-friendly promotions",
        "Highlight convenient weekend hours",
      ],
      tags: this.generateTags("saturday_special", title, extendedAudience),
      dealType: this.getDealType("saturday_special"),
      termsAndConditions: this.generateTermsAndConditions("saturday_special", discount),
      image: this.getDefaultThumbnail("saturday_special"),
    };
  }

  private static async createSundaySelfcareTemplate(
    businessName: string,
    industry: string,
    targetAudience: string[],
    discountRange: string,
    suggestedHours: string[],
    brandVoice: string[] = []
  ): Promise<DealTemplate> {
    const discount = this.extractDiscountNumber(discountRange);
    const extendedAudience = [...targetAudience, "Wellness seekers", "Self-care enthusiasts"];

    // Generate AI-powered title and description
    const { title, description } = await this.generateAITitleAndDescription({
      businessName,
      industry,
      occasion: "sunday_selfcare",
      targetAudience: extendedAudience,
      discountRange,
      brandVoice,
      dealType: "sunday self-care special",
    });

    return {
      title,
      description,
      suggestedDiscount: discountRange,
      targetAudience: extendedAudience,
      bestTiming: {
        days: ["Sunday"],
        hours: suggestedHours.length > 0 ? suggestedHours : ["Morning (9-12 PM)", "Afternoon (2-5 PM)"],
        seasonalNote: "Focus on relaxation and preparation for the week",
      },
      callToAction: `Recharge your soul - visit ${businessName} this Sunday!`,
      marketingTips: [
        "Use calming, peaceful imagery",
        "Emphasize relaxation and self-care",
        "Target wellness-focused customers",
        "Promote stress relief benefits",
        "Consider brunch or spa-like experiences",
        "Use #SelfCareSunday hashtag",
      ],
      tags: this.generateTags("sunday_selfcare", title, extendedAudience),
      dealType: this.getDealType("sunday_selfcare"),
      termsAndConditions: this.generateTermsAndConditions("sunday_selfcare", discount),
      image: this.getDefaultThumbnail("sunday_selfcare"),
    };
  }

  // Helper methods

  /**
   * Generate tags based on occasion and template content
   */
  private static generateTags(
    occasion: string,
    title: string,
    targetAudience: string[],
    additionalTags: string[] = []
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

    // Add audience-based tags
    const audienceTags = targetAudience
      .slice(0, 3)
      .map(a => a.toLowerCase().replace(/\s+/g, "-"));
    baseTags.push(...audienceTags);

    // Add any additional tags
    baseTags.push(...additionalTags);

    // Extract key words from title
    const titleWords = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 3);
    baseTags.push(...titleWords);

    // Remove duplicates and return
    return [...new Set(baseTags)].slice(0, 10);
  }

  /**
   * Get deal type based on occasion
   */
  private static getDealType(occasion: string): string {
    const dealTypeMap: Record<string, string> = {
      holiday: "offer",
      seasonal: "offer",
      slow_period: "flashdeal",
      trending: "spotlight",
      general: "offer",
      monday_motivation: "offer",
      tuesday_twofer: "offer",
      wednesday_midweek: "offer",
      thursday_throwback: "offer",
      friday_deals: "offer",
      saturday_special: "social_event",
      sunday_selfcare: "offer",
    };

    return dealTypeMap[occasion] || "offer";
  }

  /**
   * Generate terms and conditions based on occasion
   */
  private static generateTermsAndConditions(occasion: string, discount: string): string {
    const baseTerms = `Valid on selected items only. ${discount}% discount applied at checkout. `;

    const occasionTerms: Record<string, string> = {
      holiday: "Offer valid during holiday period only. Cannot be combined with other promotions. ",
      seasonal: "Seasonal offer subject to availability. Limited quantities may apply. ",
      slow_period: "Valid only during specified off-peak hours. ",
      trending: "Limited time offer while supplies last. ",
      general: "Standard terms and conditions apply. ",
      monday_motivation: "Valid on Mondays only. ",
      tuesday_twofer: "Buy one get one offer. Second item must be of equal or lesser value. Valid on Tuesdays only. ",
      wednesday_midweek: "Valid on Wednesdays only. ",
      thursday_throwback: "Valid on Thursdays only. Applies to classic/featured items. ",
      friday_deals: "Valid on Fridays only. ",
      saturday_special: "Valid on Saturdays only. Group size limits may apply. ",
      sunday_selfcare: "Valid on Sundays only. ",
    };

    return baseTerms + (occasionTerms[occasion] || occasionTerms.general) +
      "Management reserves the right to modify or cancel this offer at any time. Not valid with other offers or discounts.";
  }

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
