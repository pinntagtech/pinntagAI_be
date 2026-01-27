import OpenAI from "openai";
import mongoose from "mongoose";
import { logger } from "../../utils/logger.js";
import { BusinessAIAssistantModel } from "../../models/businessAIAssistant.model.js";
import { AI_TrainingModel } from "../../models/AI_Training.model.js";
import { UsageTrackingService } from "./usageTracking.service.js";
import { UsageType } from "../../models/aiUsage.model.js";
import {
  filterInappropriateTitles,
  isConversationalResponse,
} from "../../utils/contentModeration.utils.js";
import { ApiError } from "../controllers/controller.utils.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===========================
// Types
// ===========================

export type ContentCreationType =
  | "offer"
  | "flashdeal"
  | "spotlight"
  | "dropped_pin"
  | "business_event";

export type PromotionType =
  | "percent_off"
  | "dollar_off"
  | "bogo"
  | "free_item"
  | "happy_hour"
  | "combo_bundle"
  | "custom_deal"
  | "family_fun";

export interface GenerateTitlesRequest {
  businessId: string;
  contentType: ContentCreationType;
  category?: string;
  subCategory?: string;
  tags?: string[];
  promotionType?: PromotionType;
  percentOffValue?: number;
  dollarOffValue?: number;
  bogoOrFreeItem?: string;
  count?: number;
  refreshSeed?: string;
  excludeTitles?: string[]; // Titles to exclude (used for refresh to avoid duplicates)
}

export interface GenerateDescriptionRequest {
  businessId: string;
  title: string;
  contentType: ContentCreationType;
  category?: string;
  subCategory?: string;
  tags?: string[];
  promotionType?: PromotionType;
}

export interface GenerateTitlesResponse {
  success: boolean;
  titles: string[];
  metadata: {
    businessName: string;
    generatedAt: string;
    contentType: ContentCreationType;
    count: number;
  };
}

export interface GenerateDescriptionResponse {
  success: boolean;
  description: string;
  metadata: {
    businessName: string;
    generatedAt: string;
    contentType: ContentCreationType;
    titleUsed: string;
  };
}

interface ContentGenerationContext {
  businessId: string;
  businessName: string;
  businessDescription?: string;
  businessCategory: string;
  businessSubCategories: string[];
  businessTags: string[];
  assistantId: string;
  brandVoice?: string[];
  targetAudience?: string[];
}

interface TitleGenerationParams {
  context: ContentGenerationContext;
  contentType: ContentCreationType;
  category?: string;
  subCategory?: string;
  tags?: string[];
  promotionType?: PromotionType;
  percentOffValue?: number;
  dollarOffValue?: number;
  bogoOrFreeItem?: string;
  count: number;
  refreshSeed?: string;
  excludeTitles?: string[]; // Titles to exclude (used for refresh to avoid duplicates)
}

interface DescriptionGenerationParams {
  context: ContentGenerationContext;
  title: string;
  contentType: ContentCreationType;
  category?: string;
  subCategory?: string;
  tags?: string[];
  promotionType?: PromotionType;
}

// ===========================
// Service Class
// ===========================

export class ContentAssistService {
  /**
   * Get business context including AI assistant and training data
   */
  static async getBusinessContext(
    businessId: string
  ): Promise<ContentGenerationContext> {
    // Validate businessId format
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw ApiError.badRequest("Invalid businessId format", "INVALID_BUSINESS_ID");
    }

    // Get business AI assistant
    const businessAI = await BusinessAIAssistantModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!businessAI) {
      throw ApiError.badRequest(
        "Business AI assistant not found. Please create an agent first.",
        "BUSINESS_NOT_FOUND"
      );
    }

    if (!businessAI.assistantId) {
      throw ApiError.badRequest(
        "Business does not have a configured AI assistant.",
        "ASSISTANT_NOT_FOUND"
      );
    }

    // Optionally get training data for enhanced context
    const training = await AI_TrainingModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
      trainingStatus: "completed",
    });

    const responseMap = training
      ? new Map(training.responses.map((r) => [r.questionId, r.answer]))
      : new Map();

    return {
      businessId,
      businessName: businessAI.businessName,
      businessDescription: businessAI.description,
      businessCategory: businessAI.category,
      businessSubCategories: businessAI.subCategories || [],
      businessTags: businessAI.tags || [],
      assistantId: businessAI.assistantId,
      brandVoice: (responseMap.get("brand_voice") as string[]) || [],
      targetAudience: (responseMap.get("target_audience") as string[]) || [],
    };
  }

  /**
   * Generate multiple title suggestions for content
   */
  static async generateTitles(
    params: TitleGenerationParams
  ): Promise<GenerateTitlesResponse> {
    const {
      context,
      contentType,
      category,
      subCategory,
      tags,
      promotionType,
      count,
      refreshSeed,
    } = params;

    try {
      // Build the prompt
      const prompt = this.buildTitlePrompt(params);

      logger.info(
        { businessId: context.businessId, contentType, count },
        "Generating content titles"
      );

      // Create thread and run with business assistant
      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt,
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: context.assistantId,
      });

      // Poll until completion
      const finalRun = await this.pollRunUntilComplete(thread.id, run.id);

      // Get response
      const messages = await openai.beta.threads.messages.list(thread.id, {
        limit: 10,
      });
      const lastMessage = messages.data.find((m) => m.role === "assistant");
      const responseText =
        lastMessage?.content
          ?.map((c) => (c.type === "text" ? c.text.value : ""))
          .join("\n") ?? "";

      // Parse titles
      const titles = this.parseTitleSuggestions(responseText, count, contentType);

      // Track usage
      await UsageTrackingService.trackUsage({
        businessId: context.businessId,
        type: UsageType.CONTENT_GENERATION,
        subType: `content_assist_titles_${contentType}`,
        promptTokens: finalRun.usage?.prompt_tokens || 0,
        completionTokens: finalRun.usage?.completion_tokens || 0,
        totalTokens: finalRun.usage?.total_tokens || 0,
        model: "gpt-4o",
        success: true,
        metadata: {
          threadId: thread.id,
          runId: finalRun.id,
          contentType,
          category,
          subCategory,
          titlesCount: titles.length,
          isRefresh: !!refreshSeed,
        },
      });

      logger.info(
        { businessId: context.businessId, titlesCount: titles.length },
        "Content titles generated successfully"
      );

      return {
        success: true,
        titles,
        metadata: {
          businessName: context.businessName,
          generatedAt: new Date().toISOString(),
          contentType,
          count: titles.length,
        },
      };
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: context.businessId },
        "Error generating titles"
      );

      // Return fallback titles on error
      const fallbackTitles = this.getFallbackTitles(contentType, count);
      return {
        success: true,
        titles: fallbackTitles,
        metadata: {
          businessName: context.businessName,
          generatedAt: new Date().toISOString(),
          contentType,
          count: fallbackTitles.length,
        },
      };
    }
  }

  /**
   * Generate description based on selected title
   */
  static async generateDescription(
    params: DescriptionGenerationParams
  ): Promise<GenerateDescriptionResponse> {
    const { context, title, contentType, category, subCategory, tags, promotionType } =
      params;

    try {
      // Build the prompt
      const prompt = this.buildDescriptionPrompt(params);

      logger.info(
        { businessId: context.businessId, contentType, title },
        "Generating content description"
      );

      // Create thread and run with business assistant
      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt,
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: context.assistantId,
      });

      // Poll until completion
      const finalRun = await this.pollRunUntilComplete(thread.id, run.id);

      // Get response
      const messages = await openai.beta.threads.messages.list(thread.id, {
        limit: 10,
      });
      const lastMessage = messages.data.find((m) => m.role === "assistant");
      const responseText =
        lastMessage?.content
          ?.map((c) => (c.type === "text" ? c.text.value : ""))
          .join("\n") ?? "";

      // Parse description
      const description = this.parseDescription(responseText);

      // Track usage
      await UsageTrackingService.trackUsage({
        businessId: context.businessId,
        type: UsageType.CONTENT_GENERATION,
        subType: `content_assist_description_${contentType}`,
        promptTokens: finalRun.usage?.prompt_tokens || 0,
        completionTokens: finalRun.usage?.completion_tokens || 0,
        totalTokens: finalRun.usage?.total_tokens || 0,
        model: "gpt-4o",
        success: true,
        metadata: {
          threadId: thread.id,
          runId: finalRun.id,
          contentType,
          category,
          subCategory,
          titleUsed: title,
          descriptionLength: description.length,
        },
      });

      logger.info(
        { businessId: context.businessId, descriptionLength: description.length },
        "Content description generated successfully"
      );

      return {
        success: true,
        description,
        metadata: {
          businessName: context.businessName,
          generatedAt: new Date().toISOString(),
          contentType,
          titleUsed: title,
        },
      };
    } catch (error: any) {
      logger.error(
        { error: error.message, businessId: context.businessId },
        "Error generating description"
      );

      // Return fallback description on error
      const fallbackDescription = this.getFallbackDescription(contentType, title);
      return {
        success: true,
        description: fallbackDescription,
        metadata: {
          businessName: context.businessName,
          generatedAt: new Date().toISOString(),
          contentType,
          titleUsed: title,
        },
      };
    }
  }

  /**
   * Build prompt for title generation based on content type
   */
  private static buildTitlePrompt(params: TitleGenerationParams): string {
    const {
      context,
      contentType,
      category,
      subCategory,
      tags,
      promotionType,
      percentOffValue,
      dollarOffValue,
      bogoOrFreeItem,
      count,
      refreshSeed,
      excludeTitles,
    } = params;

    const typeInstructions = this.getTitleInstructions(contentType, promotionType);

    // Build promotion details string
    let promotionDetails = "";
    if (promotionType) {
      promotionDetails = `- Promotion Type: ${promotionType.replace(/_/g, " ")}`;
      if (promotionType === "percent_off" && percentOffValue) {
        promotionDetails += `\n- Discount: ${percentOffValue}% off`;
      } else if (promotionType === "dollar_off" && dollarOffValue) {
        promotionDetails += `\n- Discount: $${dollarOffValue} off`;
      } else if ((promotionType === "bogo" || promotionType === "free_item") && bogoOrFreeItem) {
        promotionDetails += `\n- Item: ${bogoOrFreeItem}`;
      }
    }

    return `Generate exactly ${count} compelling headlines/titles for the following content.

BUSINESS INFORMATION:
- Name: ${context.businessName}
- Description: ${context.businessDescription || "N/A"}
- Category: ${context.businessCategory}
- Sub-categories: ${context.businessSubCategories.join(", ") || "N/A"}
- Tags: ${context.businessTags.join(", ") || "N/A"}
${context.brandVoice?.length ? `- Brand Voice: ${context.brandVoice.join(", ")}` : ""}
${context.targetAudience?.length ? `- Target Audience: ${context.targetAudience.join(", ")}` : ""}

CONTENT DETAILS:
- Content Type: ${contentType}
${category ? `- Category: ${category}` : ""}
${subCategory ? `- Sub-Category: ${subCategory}` : ""}
${tags?.length ? `- Additional Tags: ${tags.join(", ")}` : ""}
${promotionDetails}

${typeInstructions}

REQUIREMENTS:
1. Each title should be attention-grabbing and action-oriented
2. Keep titles concise (5-10 words maximum)
3. Make titles specific to the business and content type
4. Use the brand voice if specified
5. Create variety - don't repeat similar patterns
6. NEVER ask for more information - always generate titles with available context
7. NEVER respond with conversational text like "I'm sorry" or "I need more details"
8. ALWAYS generate exactly ${count} titles, no matter what

${refreshSeed ? `[Refresh seed: ${refreshSeed} - generate completely different titles than before]` : ""}
${excludeTitles?.length ? `
IMPORTANT - DO NOT USE THESE TITLES (already generated):
${excludeTitles.map((t, i) => `${i + 1}. "${t}"`).join("\n")}

Generate completely NEW and DIFFERENT titles. Do not repeat or closely rephrase any of the above.` : ""}

CRITICAL: You MUST return ONLY a valid JSON object. No explanations, no apologies, no questions.
Return ONLY a JSON object in this exact format:
{
  "titles": [
    "Title 1 here",
    "Title 2 here"
  ]
}`;
  }

  /**
   * Get content type specific instructions for title generation
   */
  private static getTitleInstructions(
    contentType: ContentCreationType,
    promotionType?: PromotionType
  ): string {
    const instructions: Record<ContentCreationType, string> = {
      offer: `OFFER TITLES:
PURPOSE: Low-friction incentives that convert discovery into visits. Evergreen deals, first-visit offers, or simple conversion boosters.
SCENARIOS: "10% off your first coffee", "Free consultation", "Free dessert with entrée"
STYLE GUIDELINES:
- Emphasize value, savings, or exclusive benefits
- Focus on trial and conversion (not urgency)
- Make it feel like a welcoming invitation
- Highlight what makes the offer compelling
- Examples: "Your First Visit Treat Awaits", "New Here? Enjoy 10% Off", "Complimentary Dessert with Dinner"`,

      flashdeal: `FLASH DEAL TITLES (${promotionType?.replace(/_/g, " ") || "discount"}):
PURPOSE: Real-time lever to fill quiet periods, move inventory, and drive immediate foot traffic. Action needed NOW.
SCENARIOS: End-of-day pastry box, Iced coffee special 3-5pm, Lunch deal today only, Slow hour specials
STYLE GUIDELINES:
- Create strong urgency (limited time, limited quantity)
- Be bold and attention-grabbing
- Emphasize the short-term nature and immediate action needed
- For ${promotionType?.replace(/_/g, " ") || "promotions"}: focus on immediate, tangible value
- Examples: "2-Hour Flash: 50% Off Pastries", "Today Only: BOGO Everything", "Last Chance: Limited Quantity Left"`,

      spotlight: `SPOTLIGHT TITLES:
PURPOSE: Showcase what makes the business unique. Highlight features, achievements, or behind-the-scenes content.
SCENARIOS: New menu item, staff spotlight, customer story, milestone celebration, behind-the-scenes
STYLE GUIDELINES:
- Focus on uniqueness and curiosity
- Highlight what sets the business apart
- Create intrigue that drives engagement
- Celebrate achievements or special features
- Examples: "Meet Our Head Chef", "Behind the Scenes", "What Makes Us Different"`,

      dropped_pin: `DROP PIN TITLES:
PURPOSE: Unique advantage for mobile/temporary locations. Lets nearby customers find you instantly.
SCENARIOS: Food truck locations, pop-up vendors, market stands, event vendors, mobile services
STYLE GUIDELINES:
- Location-focused and immediate
- Create a sense of discovery and proximity
- Perfect for mobile-first, on-the-go customers
- Capture impulse purchases from nearby foot traffic
- Examples: "We're Here Now!", "Find Us at the Park", "Pop-Up Alert: Limited Time Spot"`,

      business_event: `EVENT TITLES:
PURPOSE: Create anticipation and give people a reason to plan a visit. Scheduled experiences with specific date/time.
SCENARIOS: Trivia Night, Live Music, Saturday class series, Wine Tasting, Watch Party
STYLE GUIDELINES:
- Focus on the experience and atmosphere
- Create excitement that makes people want to plan ahead
- Highlight what makes this event special or unique
- Make it feel like a destination worth visiting
- Examples: "Trivia Night: Test Your Knowledge", "Live Jazz Returns This Weekend", "Wine Tasting Experience Awaits"`,
    };

    return instructions[contentType];
  }

  /**
   * Build prompt for description generation based on content type
   */
  private static buildDescriptionPrompt(
    params: DescriptionGenerationParams
  ): string {
    const { context, title, contentType, category, subCategory, tags, promotionType } =
      params;

    const typeInstructions = this.getDescriptionInstructions(
      contentType,
      promotionType
    );

    return `Generate a compelling description for the following content.

BUSINESS INFORMATION:
- Name: ${context.businessName}
- Description: ${context.businessDescription || "N/A"}
- Category: ${context.businessCategory}
${context.brandVoice?.length ? `- Brand Voice: ${context.brandVoice.join(", ")}` : ""}
${context.targetAudience?.length ? `- Target Audience: ${context.targetAudience.join(", ")}` : ""}

CONTENT DETAILS:
- Selected Title/Headline: "${title}"
- Content Type: ${contentType}
${category ? `- Category: ${category}` : ""}
${subCategory ? `- Sub-Category: ${subCategory}` : ""}
${tags?.length ? `- Tags: ${tags.join(", ")}` : ""}
${promotionType ? `- Promotion Type: ${promotionType.replace(/_/g, " ")}` : ""}

${typeInstructions}

REQUIREMENTS:
1. The description should complement and expand on the title
2. Keep it concise but informative (2-4 sentences, 50-150 words)
3. Include a subtle call-to-action when appropriate
4. Match the brand voice
5. Make it mobile-friendly (easy to read on small screens)
6. Do NOT include placeholder text like [date] or [time] - be general or omit

Return ONLY the description text, no JSON, no quotes, no labels.`;
  }

  /**
   * Get content type specific instructions for description generation
   */
  private static getDescriptionInstructions(
    contentType: ContentCreationType,
    promotionType?: PromotionType
  ): string {
    const instructions: Record<ContentCreationType, string> = {
      offer: `OFFER DESCRIPTION GUIDELINES:
PURPOSE: Convert discovery into visits. Lower barriers for first-time customers.
- Clearly explain what the offer includes and its value
- Make it feel welcoming and low-risk to try
- Focus on trial and discovery, not pressure
- End with a warm invitation to visit
- Highlight what makes this worth trying`,

      flashdeal: `FLASH DEAL DESCRIPTION GUIDELINES:
PURPOSE: Drive immediate foot traffic during slow periods. Fill empty seats fast.
- Emphasize the limited time nature clearly
- Make the value proposition crystal clear and immediate
- Create urgency that converts NOW (not later)
- For ${promotionType?.replace(/_/g, " ") || "promotions"}: highlight the specific, tangible benefit
- Focus on "come now" messaging`,

      spotlight: `SPOTLIGHT DESCRIPTION GUIDELINES:
PURPOSE: Showcase uniqueness and drive engagement through storytelling.
- Highlight what makes this feature, person, or achievement special
- Create curiosity and intrigue
- Tell a compelling story in a concise format
- Encourage engagement and sharing`,

      dropped_pin: `DROP PIN DESCRIPTION GUIDELINES:
PURPOSE: Help mobile/pop-up businesses get discovered instantly by nearby customers.
- Focus on location, proximity, and immediacy
- Keep it very short and punchy (people are on-the-go)
- Create a sense of discovery and serendipity
- Capture impulse decisions from foot traffic
- Include what they'll find when they arrive`,

      business_event: `EVENT DESCRIPTION GUIDELINES:
PURPOSE: Create anticipation and make people plan a visit. Turn venue into a destination.
- Describe the experience attendees can expect
- Create excitement that encourages planning ahead
- Mention any special guests, features, or highlights
- Make it feel like a destination worth visiting
- Encourage social sharing and bringing friends`,
    };

    return instructions[contentType];
  }

  /**
   * Parse title suggestions from AI response
   */
  private static parseTitleSuggestions(
    responseText: string,
    expectedCount: number,
    contentType: ContentCreationType
  ): string[] {
    try {
      // Check if the entire response is a conversational response (AI asking for more info)
      if (isConversationalResponse(responseText)) {
        logger.warn(
          { responseText: responseText.substring(0, 200) },
          "AI returned conversational response instead of titles, using fallbacks"
        );
        return this.getFallbackTitles(contentType, expectedCount);
      }

      let titles: string[] = [];

      // Try to parse as JSON first
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.titles && Array.isArray(parsed.titles)) {
          titles = parsed.titles
            .filter(
              (title: any) =>
                typeof title === "string" && title.trim().length > 0
            )
            .map((title: string) => title.trim());
        }
      }

      // If JSON parsing didn't yield results, try plain text (numbered list)
      if (titles.length === 0) {
        titles = responseText
          .split("\n")
          .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter((line) => line.length > 0 && line.length < 100);
      }

      // Filter out conversational responses and inappropriate content
      titles = filterInappropriateTitles(titles);

      if (titles.length >= expectedCount) {
        return titles.slice(0, expectedCount);
      }

      // If we have some valid titles but not enough, return what we have
      if (titles.length > 0) {
        return titles;
      }

      // If no valid titles, return fallback
      logger.warn("Failed to parse valid titles from response, using fallbacks");
      return this.getFallbackTitles(contentType, expectedCount);
    } catch (error) {
      logger.error({ error }, "Error parsing title suggestions");
      return this.getFallbackTitles(contentType, expectedCount);
    }
  }

  /**
   * Parse description from AI response
   */
  private static parseDescription(responseText: string): string {
    // Clean up the response - remove any JSON wrapping or labels
    let description = responseText.trim();

    // Remove JSON wrapper if present
    const jsonMatch = description.match(/"description"\s*:\s*"([^"]+)"/);
    if (jsonMatch) {
      description = jsonMatch[1];
    }

    // Remove common labels
    description = description
      .replace(/^description:\s*/i, "")
      .replace(/^output:\s*/i, "")
      .trim();

    // Remove surrounding quotes
    if (
      (description.startsWith('"') && description.endsWith('"')) ||
      (description.startsWith("'") && description.endsWith("'"))
    ) {
      description = description.slice(1, -1);
    }

    return description || this.getFallbackDescription("offer", "");
  }

  /**
   * Poll until the run is complete
   */
  private static async pollRunUntilComplete(
    threadId: string,
    runId: string,
    maxAttempts: number = 30
  ): Promise<OpenAI.Beta.Threads.Runs.Run> {
    let attempts = 0;
    while (attempts < maxAttempts) {
      const run = await openai.beta.threads.runs.retrieve(runId, {
        thread_id: threadId,
      });

      if (run.status === "completed") {
        return run;
      }

      if (
        run.status === "failed" ||
        run.status === "cancelled" ||
        run.status === "expired"
      ) {
        throw new Error(
          `Run ${run.status}: ${run.last_error?.message || "Unknown error"}`
        );
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error("Run timed out");
  }

  /**
   * Generate fallback titles if AI generation fails
   */
  private static getFallbackTitles(
    contentType: ContentCreationType,
    count: number
  ): string[] {
    const fallbacks: Record<ContentCreationType, string[]> = {
      offer: [
        "Your First Visit Treat Awaits",
        "New Here? Welcome Offer Inside",
        "Try Something New Today",
        "Exclusive Welcome Offer",
        "First-Timer Special",
        "Complimentary Treat with Visit",
        "Your Invitation to Try Us",
        "New Customer Special",
        "Welcome Gift Awaits",
        "Discover Us with This Offer",
      ],
      flashdeal: [
        "Limited Time Only - Act Now",
        "Flash Deal: Hours Left",
        "Quick! Before It's Gone",
        "Today Only Special",
        "Hurry - While Supplies Last",
        "Right Now: Flash Savings",
        "Don't Wait - Ending Soon",
        "Time's Running Out",
        "Grab It Before It's Gone",
        "Last Chance Today",
      ],
      spotlight: [
        "Discover What Makes Us Special",
        "Behind the Scenes",
        "Meet the Team",
        "Our Story, Your Experience",
        "What Sets Us Apart",
        "A Closer Look Inside",
        "Spotlight On Us",
        "The Story Behind the Magic",
        "Why We Do What We Do",
        "Something Worth Sharing",
      ],
      dropped_pin: [
        "We're Here Right Now",
        "Find Us Nearby",
        "Pop-Up Alert!",
        "Spotted: We're Here",
        "Live Location Drop",
        "Come Find Us Today",
        "Here for a Limited Time",
        "We've Landed Nearby",
        "Catch Us While You Can",
        "Your Nearby Discovery",
      ],
      business_event: [
        "Join Us for Something Special",
        "An Experience Awaits",
        "Mark Your Calendar",
        "You're Invited",
        "Experience the Magic",
        "Plan Your Visit",
        "A Night to Remember",
        "Save the Date",
        "Bring Your Friends",
        "Make It a Date Night",
      ],
    };

    return fallbacks[contentType].slice(0, count);
  }

  /**
   * Generate fallback description if AI generation fails
   */
  private static getFallbackDescription(
    contentType: ContentCreationType,
    title: string
  ): string {
    const fallbacks: Record<ContentCreationType, string> = {
      offer:
        "We'd love to welcome you! Take advantage of this special offer on your first visit and discover what makes us worth coming back for. No pressure, just great value waiting for you.",
      flashdeal:
        "This won't last long! We're offering something special right now for a limited time. Come in before it's gone and take advantage of these savings today.",
      spotlight:
        "There's something special we want to share with you. Take a closer look at what makes us unique and discover the story behind what we do.",
      dropped_pin:
        "We're here right now! Find us nearby and discover what we're serving up today. Stop by while we're in the area - we'd love to see you!",
      business_event:
        "Mark your calendar and plan your visit! This is your chance to experience something special with us. Bring friends, make memories, and be part of something worth talking about.",
    };

    return fallbacks[contentType];
  }
}
