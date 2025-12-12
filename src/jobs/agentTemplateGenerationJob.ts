import { logger } from "../utils/logger.js";
import { AI_TrainingModel } from "../models/AI_Training.model.js";
import { BusinessAIAssistantModel } from "../models/businessAIAssistant.model.js";
import { DealTemplateGeneratorService, TemplateGenerationOptions } from "../api/services/dealTemplateGenerator.service.js";
import { GeminiService } from "../api/services/gemini.service.js";
import mongoose from "mongoose";

/**
 * Agent Template Generation Job
 * Runs overnight to generate templates for all AI agents based on their training status
 *
 * For trained agents: Uses training data to generate business-specific templates
 * For untrained agents: Uses agent metadata (category, subcategories, tags, description) to generate templates
 */
export class AgentTemplateGenerationJob {
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
    // Generate business-specific templates for common occasions with AI-generated images
    const occasions: TemplateGenerationOptions[] = [
      { occasion: "general", scope: "business_specific" },
      { occasion: "seasonal", scope: "business_specific" },
      { occasion: "slow_period", scope: "business_specific" },
      { occasion: "trending", scope: "business_specific" },
    ];

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

    logger.info(
      { businessId, category, subCategories, tags },
      "Generating metadata-based templates for untrained agent"
    );

    // Generate templates based on agent metadata
    const occasions: Array<{
      occasion: TemplateGenerationOptions["occasion"];
      title: string;
      descriptionText: string;
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

    for (const { occasion, title, descriptionText } of occasions) {
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
    description?: string
  ): string {
    const parts: string[] = [];

    if (occasion === "general") {
      parts.push("Discover amazing value with our exclusive offer!");
    } else if (occasion === "seasonal") {
      parts.push("Celebrate the season with our special limited-time offer!");
    } else if (occasion === "trending") {
      parts.push("Join the trend! Everyone's talking about this amazing deal!");
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
        tags: agent.tags || [],
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
  private static getDefaultThumbnail(occasion?: string): string {
    const baseUrl =
      "https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/";

    const thumbnails: Record<string, string> = {
      holiday: `${baseUrl}Holiday_Special.jpg`,
      seasonal: `${baseUrl}Seasonal_Sale.jpg`,
      slow_period: `${baseUrl}Off_Peak_Deal.jpg`,
      trending: `${baseUrl}Trending_Now.jpg`,
      general: `${baseUrl}Special_Offer.jpg`,
    };

    return thumbnails[occasion || "general"] || thumbnails.general;
  }
}
