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
  containsProfanity,
} from "../../utils/contentModeration.utils.js";
import { ApiError } from "../controllers/controller.utils.js";
import { openai } from "../../utils/openai.js";
// Plain chat completions go through the LLM facade so they're portable to a
// self-hosted model. The Assistants/Threads calls below stay on `openai`
// directly — they're OpenAI-specific and not yet portable (see MAINTAINER_NOTES).
import { llm } from "../../utils/llm.js";

// ===========================
// Types
// ===========================

export type ContentCreationType =
  | "offer"
  | "flashdeal"
  | "specials"
  | "drop_pin"
  | "event"
  | "reward";

export type PromotionType =
  | "percent_off"
  | "dollar_off"
  | "bogo"
  | "free_item"
  | "happy_hour"
  | "combo_bundle"
  | "custom_deal"
  | "family_fun";

// ===========================
// Notification Types
// ===========================

export type NotificationAppType = "CONSUMER" | "BUSINESS";

export type NotificationTriggerType =
  | "offer_expiring"
  | "offer_viewed_not_redeemed"
  | "reward_progress"
  | "new_event_nearby"
  | "business_inactivity"
  | "business_new_review"
  | "weekend_events"
  | "lunch_deals"
  | "weekly_summary";

export type NotificationTone = "playful" | "helpful" | "urgent" | "coach";

export interface GenerateNotificationCopyRequest {
  appType: NotificationAppType;
  triggerType: NotificationTriggerType;
  context: NotificationContext;
  tone?: NotificationTone;
  variantCount?: number;
  emojiAllowed?: boolean;
}

export interface NotificationContext {
  // Offer/Event context
  offerName?: string;
  eventName?: string;
  businessName?: string;
  businessId?: string;
  category?: string;
  // Time/location context
  timeWindow?: string;
  distanceBucket?: string;
  cityArea?: string;
  expiresIn?: string;
  // Reward context
  rewardProgress?: number;
  rewardTarget?: number;
  rewardName?: string;
  // Business context (for business app)
  daysSinceLastPost?: number;
  newReviewRating?: number;
  // Deep link
  deepLink?: string;
}

export interface NotificationVariant {
  id: string;
  title: string;
  body: string;
  tone: NotificationTone;
  hasEmoji: boolean;
  urgencyLevel: "low" | "medium" | "high";
}

export interface GenerateNotificationCopyResponse {
  success: boolean;
  variants: NotificationVariant[];
  fallbackUsed: boolean;
  safetyFlags: string[];
  metadata: {
    appType: NotificationAppType;
    triggerType: NotificationTriggerType;
    generatedAt: string;
    variantCount: number;
  };
}

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
      brandVoice: Array.isArray(responseMap.get("brand_voice"))
        ? (responseMap.get("brand_voice") as string[])
        : typeof responseMap.get("brand_voice") === "string" && responseMap.get("brand_voice")
        ? [responseMap.get("brand_voice") as string]
        : [],
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
2. CRITICAL: Each title MUST be 60 characters or less (this is a hard limit)
3. Keep titles concise (5-10 words maximum)
4. Make titles specific to the business and content type
5. Use the brand voice if specified
6. Create variety - don't repeat similar patterns
7. NEVER ask for more information - always generate titles with available context
8. NEVER respond with conversational text like "I'm sorry" or "I need more details"
9. ALWAYS generate exactly ${count} titles, no matter what

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

      specials:`SPOTLIGHT TITLES:
PURPOSE: Showcase what makes the business unique. Highlight features, achievements, or behind-the-scenes content.
SCENARIOS: New menu item, staff spotlight, customer story, milestone celebration, behind-the-scenes
STYLE GUIDELINES:
- Focus on uniqueness and curiosity
- Highlight what sets the business apart
- Create intrigue that drives engagement
- Celebrate achievements or special features
- Examples: "Meet Our Head Chef", "Behind the Scenes", "What Makes Us Different"`,

      drop_pin: `DROP PIN TITLES:
PURPOSE: Unique advantage for mobile/temporary locations. Lets nearby customers find you instantly.
SCENARIOS: Food truck locations, pop-up vendors, market stands, event vendors, mobile services
STYLE GUIDELINES:
- Location-focused and immediate
- Create a sense of discovery and proximity
- Perfect for mobile-first, on-the-go customers
- Capture impulse purchases from nearby foot traffic
- Examples: "We're Here Now!", "Find Us at the Park", "Pop-Up Alert: Limited Time Spot"`,

      event: `EVENT TITLES:
PURPOSE: Create anticipation and give people a reason to plan a visit. Scheduled experiences with specific date/time.
SCENARIOS: Trivia Night, Live Music, Saturday class series, Wine Tasting, Watch Party
STYLE GUIDELINES:
- Focus on the experience and atmosphere
- Create excitement that makes people want to plan ahead
- Highlight what makes this event special or unique
- Make it feel like a destination worth visiting
- Examples: "Trivia Night: Test Your Knowledge", "Live Jazz Returns This Weekend", "Wine Tasting Experience Awaits"`,

      reward: `REWARD TITLES:
PURPOSE: Loyalty-driven incentives that recognize repeat customers and encourage continued engagement. Earn-and-redeem mechanics, points, perks, or VIP benefits.
SCENARIOS: "Earn 100 points on every visit", "Free coffee on your 10th order", "VIP member exclusive perk", "Cashback on next purchase", "Birthday reward"
STYLE GUIDELINES:
- Emphasize earning, status, and exclusivity
- Make customers feel valued and recognized
- Highlight the long-term benefit of staying engaged
- Focus on the perk or milestone, not urgency
- Examples: "Unlock Your Free Drink", "VIP Perk Just for You", "Earn Double Points This Week", "Your Loyalty Pays Off"`,
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
2. CRITICAL: Description MUST be 140 characters or less (this is a hard limit for short descriptions)
3. Keep it concise - 1-2 sentences maximum
4. Include a subtle call-to-action when appropriate
5. Match the brand voice
6. Make it mobile-friendly (easy to read on small screens)
7. Do NOT include placeholder text like [date] or [time] - be general or omit

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

      specials:`SPOTLIGHT DESCRIPTION GUIDELINES:
PURPOSE: Showcase uniqueness and drive engagement through storytelling.
- Highlight what makes this feature, person, or achievement special
- Create curiosity and intrigue
- Tell a compelling story in a concise format
- Encourage engagement and sharing`,

      drop_pin: `DROP PIN DESCRIPTION GUIDELINES:
PURPOSE: Help mobile/pop-up businesses get discovered instantly by nearby customers.
- Focus on location, proximity, and immediacy
- Keep it very short and punchy (people are on-the-go)
- Create a sense of discovery and serendipity
- Capture impulse decisions from foot traffic
- Include what they'll find when they arrive`,

      event: `EVENT DESCRIPTION GUIDELINES:
PURPOSE: Create anticipation and make people plan a visit. Turn venue into a destination.
- Describe the experience attendees can expect
- Create excitement that encourages planning ahead
- Mention any special guests, features, or highlights
- Make it feel like a destination worth visiting
- Encourage social sharing and bringing friends`,

      reward: `REWARD DESCRIPTION GUIDELINES:
PURPOSE: Reinforce loyalty and motivate continued engagement through earn-and-redeem mechanics.
- Clearly explain what the customer earns or unlocks
- Make customers feel recognized and valued
- Highlight the perk, milestone, or status benefit
- Focus on long-term value, not short-term urgency
- End with an inviting nudge to keep coming back`,
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

      // Enforce 60 character limit - truncate if necessary
      titles = titles.map((title) =>
        title.length > 60 ? title.substring(0, 57) + "..." : title
      );

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

    // Enforce 140 character limit - truncate if necessary
    if (description.length > 140) {
      description = description.substring(0, 137) + "...";
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
      specials:[
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
      drop_pin: [
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
      event: [
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
      reward: [
        "Your Loyalty Pays Off",
        "Unlock Your Reward",
        "VIP Perk Just for You",
        "Earn Points on Every Visit",
        "A Thank-You from Us",
        "Members-Only Treat",
        "You've Earned This",
        "Exclusive Reward Inside",
        "Keep Coming Back, Keep Earning",
        "A Little Something for Regulars",
      ],
    };

    return fallbacks[contentType].slice(0, count);
  }

  /**
   * Generate fallback description if AI generation fails
   */
  private static getFallbackDescription(
    contentType: ContentCreationType,
    _title: string
  ): string {
    const fallbacks: Record<ContentCreationType, string> = {
      offer:
        "We'd love to welcome you! Take advantage of this special offer on your first visit and discover what makes us worth coming back for. No pressure, just great value waiting for you.",
      flashdeal:
        "This won't last long! We're offering something special right now for a limited time. Come in before it's gone and take advantage of these savings today.",
      specials:
        "There's something special we want to share with you. Take a closer look at what makes us unique and discover the story behind what we do.",
      drop_pin:
        "We're here right now! Find us nearby and discover what we're serving up today. Stop by while we're in the area - we'd love to see you!",
      event:
        "Mark your calendar and plan your visit! This is your chance to experience something special with us. Bring friends, make memories, and be part of something worth talking about.",
      reward:
        "Your loyalty deserves recognition. Unlock this exclusive perk as a thank-you for being a regular - and keep earning more every time you visit.",
    };

    return fallbacks[contentType];
  }

  // ===========================
  // Notification Copy Generation
  // ===========================

  /**
   * Generate notification copy variants for push notifications
   * Following PinnTag Notification Architecture safety and style guidelines
   */
  static async generateNotificationCopy(
    request: GenerateNotificationCopyRequest
  ): Promise<GenerateNotificationCopyResponse> {
    const {
      appType,
      triggerType,
      context,
      tone = appType === "CONSUMER" ? "playful" : "coach",
      variantCount = 5,
      emojiAllowed = true,
    } = request;

    try {
      const prompt = this.buildNotificationPrompt({
        appType,
        triggerType,
        context,
        tone,
        variantCount,
        emojiAllowed,
      });

      logger.info(
        { appType, triggerType, variantCount },
        "Generating notification copy variants"
      );

      // Use chat completions for notification copy (no assistant needed)
      const completion = await llm.chatCompletion({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: this.getNotificationSystemPrompt(appType),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content || "";

      // Parse variants from response
      let variants = this.parseNotificationVariants(
        responseText,
        variantCount,
        tone
      );

      // Apply safety filters
      const { filteredVariants, safetyFlags } =
        this.applyNotificationSafetyFilters(variants);

      // If all variants were filtered, use fallbacks
      const fallbackUsed = filteredVariants.length === 0;
      const finalVariants = fallbackUsed
        ? this.getFallbackNotificationVariants(appType, triggerType, context)
        : filteredVariants;

      // Track usage
      await UsageTrackingService.trackUsage({
        businessId: context.businessId || "system",
        type: UsageType.CONTENT_GENERATION,
        subType: `notification_copy_${appType.toLowerCase()}_${triggerType}`,
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
        model: "gpt-4o",
        success: true,
        metadata: {
          appType,
          triggerType,
          variantCount: finalVariants.length,
          fallbackUsed,
          safetyFlags,
        },
      });

      logger.info(
        {
          appType,
          triggerType,
          variantCount: finalVariants.length,
          fallbackUsed,
        },
        "Notification copy generated successfully"
      );

      return {
        success: true,
        variants: finalVariants,
        fallbackUsed,
        safetyFlags,
        metadata: {
          appType,
          triggerType,
          generatedAt: new Date().toISOString(),
          variantCount: finalVariants.length,
        },
      };
    } catch (error: any) {
      logger.error(
        { error: error.message, appType, triggerType },
        "Error generating notification copy"
      );

      // Return fallback variants on error
      const fallbackVariants = this.getFallbackNotificationVariants(
        appType,
        triggerType,
        context
      );

      return {
        success: true,
        variants: fallbackVariants,
        fallbackUsed: true,
        safetyFlags: ["ai_generation_failed"],
        metadata: {
          appType,
          triggerType,
          generatedAt: new Date().toISOString(),
          variantCount: fallbackVariants.length,
        },
      };
    }
  }

  /**
   * System prompt for notification copy generation
   */
  private static getNotificationSystemPrompt(
    appType: NotificationAppType
  ): string {
    const brandVoice =
      appType === "CONSUMER"
        ? "playful, fun, Zomato/Swiggy-like tone - energetic and engaging"
        : "coach/operator tone - supportive, actionable, business-focused";

    return `You are PinnTagAI, a notification copy specialist for the PinnTag ${appType.toLowerCase()} app.

BRAND VOICE: ${brandVoice}

CRITICAL SAFETY RULES - NEVER VIOLATE:
1. NO sensitive personal traits or health/financial assumptions
2. NO deception - scarcity/discount claims must be truthful
3. NO harassment or shaming language (NEVER say things like "you haven't opened us in days", "we miss you", "where have you been")
4. NO profanity - keep tone playful, not rude
5. NO guilt-tripping or manipulative language
6. NO personal attribute speculation
7. Comply with Apple/Google notification guidelines

CHANNEL CONSTRAINTS:
- Title: Maximum 50 characters
- Body: Maximum 150 characters
- Keep it mobile-friendly and scannable

OUTPUT FORMAT: Return ONLY valid JSON with no additional text.`;
  }

  /**
   * Build the notification generation prompt
   */
  private static buildNotificationPrompt(params: {
    appType: NotificationAppType;
    triggerType: NotificationTriggerType;
    context: NotificationContext;
    tone: NotificationTone;
    variantCount: number;
    emojiAllowed: boolean;
  }): string {
    const { appType, triggerType, context, tone, variantCount, emojiAllowed } =
      params;

    const triggerInstructions = this.getNotificationTriggerInstructions(
      triggerType,
      appType
    );

    // Build context string
    const contextParts: string[] = [];
    if (context.offerName) contextParts.push(`Offer: ${context.offerName}`);
    if (context.eventName) contextParts.push(`Event: ${context.eventName}`);
    if (context.businessName)
      contextParts.push(`Business: ${context.businessName}`);
    if (context.category) contextParts.push(`Category: ${context.category}`);
    if (context.timeWindow)
      contextParts.push(`Time Window: ${context.timeWindow}`);
    if (context.distanceBucket)
      contextParts.push(`Distance: ${context.distanceBucket}`);
    if (context.cityArea) contextParts.push(`Area: ${context.cityArea}`);
    if (context.expiresIn)
      contextParts.push(`Expires In: ${context.expiresIn}`);
    if (context.rewardProgress !== undefined && context.rewardTarget)
      contextParts.push(
        `Reward Progress: ${context.rewardProgress}/${context.rewardTarget}`
      );
    if (context.rewardName)
      contextParts.push(`Reward: ${context.rewardName}`);
    if (context.daysSinceLastPost)
      contextParts.push(
        `Days Since Last Post: ${context.daysSinceLastPost}`
      );
    if (context.newReviewRating)
      contextParts.push(`New Review Rating: ${context.newReviewRating} stars`);
    if (context.deepLink) contextParts.push(`Deep Link: ${context.deepLink}`);

    return `Generate exactly ${variantCount} notification copy variants.

TRIGGER TYPE: ${triggerType}
APP: ${appType}
TONE: ${tone}
EMOJI ALLOWED: ${emojiAllowed ? "Yes (use sparingly, 1-2 max)" : "No"}

CONTEXT:
${contextParts.join("\n")}

${triggerInstructions}

REQUIREMENTS:
1. Title: Max 50 chars, attention-grabbing
2. Body: Max 150 chars, clear value proposition and CTA
3. Each variant should have a different approach/angle
4. Mix urgency levels (low, medium, high) across variants
5. ${emojiAllowed ? "Include 1-2 relevant emojis in some variants" : "Do not use emojis"}

Return ONLY a JSON object in this exact format:
{
  "variants": [
    {
      "title": "Short catchy title",
      "body": "Compelling body text with clear value",
      "tone": "${tone}",
      "hasEmoji": true,
      "urgencyLevel": "medium"
    }
  ]
}`;
  }

  /**
   * Get trigger-specific instructions for notification copy
   */
  private static getNotificationTriggerInstructions(
    triggerType: NotificationTriggerType,
    appType: NotificationAppType
  ): string {
    const instructions: Record<NotificationTriggerType, string> = {
      offer_expiring: `OFFER EXPIRING NOTIFICATION:
- Create urgency without being pushy
- Focus on the value they'll miss, not guilt
- Examples: "That deal is waiting", "Last chance for savings"
- AVOID: "Don't miss out!", "You're about to lose this!"`,

      offer_viewed_not_redeemed: `OFFER VIEWED NOT REDEEMED:
- Gentle reminder, not pushy follow-up
- Focus on the value/benefit
- Examples: "Still thinking it over?", "That {category} deal is waiting"
- AVOID: "You left something behind", "Complete your visit"`,

      reward_progress: `REWARD PROGRESS UPDATE:
- Celebrate progress, encourage next step
- Show how close they are to the reward
- Examples: "You're getting closer!", "X more to go"
- AVOID: "You're falling behind", "Don't lose your progress"`,

      new_event_nearby: `NEW EVENT NEARBY:
- Highlight the experience and proximity
- Create excitement about discovery
- Examples: "Something fun nearby", "New experience in your area"
- Match to user's known preferences if available`,

      business_inactivity: `BUSINESS INACTIVITY NUDGE (${appType} APP):
- Supportive coach tone, not shaming
- Focus on quick wins and benefits
- Examples: "Quick win for this week", "2 mins to get discovered"
- AVOID: "We haven't seen you", "You've been inactive"`,

      business_new_review: `NEW REVIEW NOTIFICATION:
- Inform about the review objectively
- Encourage engagement with customers
- For positive: celebrate and encourage response
- For negative: supportive tone, opportunity to respond`,

      weekend_events: `WEEKEND EVENTS (Scheduled Fri/Sat):
- Create anticipation for weekend plans
- Focus on experience and social aspect
- Examples: "Weekend plans sorted", "Your Saturday awaits"
- Time it for late afternoon/evening`,

      lunch_deals: `LUNCH DEALS (11:30-14:00 local):
- Quick, actionable, immediate value
- Focus on convenience and savings
- Examples: "Lunch sorted", "Nearby deal alert"
- Keep it snappy - people decide fast`,

      weekly_summary: `WEEKLY BUSINESS SUMMARY:
- Highlight key metrics briefly
- Encourage action with positive framing
- Examples: "Your week in review", "See how you're doing"
- Include one actionable insight`,
    };

    return instructions[triggerType];
  }

  /**
   * Parse notification variants from AI response
   */
  private static parseNotificationVariants(
    responseText: string,
    expectedCount: number,
    defaultTone: NotificationTone
  ): NotificationVariant[] {
    try {
      // Try to parse JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.variants && Array.isArray(parsed.variants)) {
          return parsed.variants
            .slice(0, expectedCount)
            .map((v: any, index: number) => ({
              id: `variant_${index + 1}`,
              title: String(v.title || "").slice(0, 50),
              body: String(v.body || "").slice(0, 150),
              tone: v.tone || defaultTone,
              hasEmoji: Boolean(v.hasEmoji),
              urgencyLevel: v.urgencyLevel || "medium",
            }));
        }
      }

      logger.warn("Failed to parse notification variants from JSON");
      return [];
    } catch (error) {
      logger.error({ error }, "Error parsing notification variants");
      return [];
    }
  }

  /**
   * Apply safety filters to notification variants
   * Based on PinnTag Notification Architecture safety rules
   */
  private static applyNotificationSafetyFilters(
    variants: NotificationVariant[]
  ): { filteredVariants: NotificationVariant[]; safetyFlags: string[] } {
    const safetyFlags: string[] = [];

    // Shaming/guilt patterns to block
    const shamingPatterns = [
      /you haven't/i,
      /we miss you/i,
      /where have you been/i,
      /you've been gone/i,
      /don't forget about us/i,
      /we noticed you/i,
      /you left/i,
      /you abandoned/i,
      /you're missing/i,
      /you're losing/i,
      /falling behind/i,
      /don't lose/i,
      /you forgot/i,
      /come back/i,
      /we're waiting/i,
      /lonely without you/i,
    ];

    // Sensitive inference patterns
    const sensitivePatterns = [
      /you (seem|look|appear|must be)/i,
      /your (health|finances|money|budget)/i,
      /struggling with/i,
      /based on your (age|gender|income)/i,
      /we know you/i,
    ];

    // Deceptive urgency patterns
    const deceptivePatterns = [
      /only \d+ left/i,
      /selling out fast/i,
      /almost gone/i,
      /everyone is/i,
      /last one/i,
    ];

    const filteredVariants = variants.filter((variant) => {
      const fullText = `${variant.title} ${variant.body}`;

      // Check for profanity
      if (containsProfanity(fullText)) {
        safetyFlags.push(`profanity_detected:${variant.id}`);
        return false;
      }

      // Check for shaming patterns
      for (const pattern of shamingPatterns) {
        if (pattern.test(fullText)) {
          safetyFlags.push(`shaming_language:${variant.id}`);
          return false;
        }
      }

      // Check for sensitive inference
      for (const pattern of sensitivePatterns) {
        if (pattern.test(fullText)) {
          safetyFlags.push(`sensitive_inference:${variant.id}`);
          return false;
        }
      }

      // Check for deceptive patterns
      for (const pattern of deceptivePatterns) {
        if (pattern.test(fullText)) {
          safetyFlags.push(`deceptive_urgency:${variant.id}`);
          return false;
        }
      }

      // Check title length
      if (variant.title.length > 50) {
        variant.title = variant.title.slice(0, 47) + "...";
        safetyFlags.push(`title_truncated:${variant.id}`);
      }

      // Check body length
      if (variant.body.length > 150) {
        variant.body = variant.body.slice(0, 147) + "...";
        safetyFlags.push(`body_truncated:${variant.id}`);
      }

      return true;
    });

    return { filteredVariants, safetyFlags };
  }

  /**
   * Get fallback notification variants when AI fails or all variants filtered
   */
  private static getFallbackNotificationVariants(
    appType: NotificationAppType,
    triggerType: NotificationTriggerType,
    context: NotificationContext
  ): NotificationVariant[] {
    const businessName = context.businessName || "a local spot";
    const category = context.category || "deal";

    const fallbacks: Record<
      NotificationTriggerType,
      NotificationVariant[]
    > = {
      offer_expiring: [
        {
          id: "fallback_1",
          title: "Still thinking it over?",
          body: `That ${category} deal is waiting. Tap to view before it's gone.`,
          tone: "playful",
          hasEmoji: false,
          urgencyLevel: "medium",
        },
        {
          id: "fallback_2",
          title: "Deal ending soon",
          body: `Save on your next visit to ${businessName}. Check it out now.`,
          tone: "helpful",
          hasEmoji: false,
          urgencyLevel: "high",
        },
      ],
      offer_viewed_not_redeemed: [
        {
          id: "fallback_1",
          title: "Still thinking it over?",
          body: `That ${category} deal is waiting. Tap to view.`,
          tone: "playful",
          hasEmoji: false,
          urgencyLevel: "low",
        },
      ],
      reward_progress: [
        {
          id: "fallback_1",
          title: "Nice progress!",
          body: `You're getting closer to your reward. Keep it up!`,
          tone: "playful",
          hasEmoji: false,
          urgencyLevel: "low",
        },
      ],
      new_event_nearby: [
        {
          id: "fallback_1",
          title: "Something fun nearby",
          body: `Check out what's happening at ${businessName}. Tap to explore.`,
          tone: "playful",
          hasEmoji: false,
          urgencyLevel: "medium",
        },
      ],
      business_inactivity: [
        {
          id: "fallback_1",
          title: "Quick win for this week",
          body: "Post a new offer in 2 mins and get discovered nearby.",
          tone: "coach",
          hasEmoji: false,
          urgencyLevel: "medium",
        },
      ],
      business_new_review: [
        {
          id: "fallback_1",
          title: "New review received",
          body: "See what customers are saying and respond to build loyalty.",
          tone: "coach",
          hasEmoji: false,
          urgencyLevel: "medium",
        },
      ],
      weekend_events: [
        {
          id: "fallback_1",
          title: "Weekend plans sorted",
          body: `Great events happening nearby. Find something fun to do.`,
          tone: "playful",
          hasEmoji: false,
          urgencyLevel: "low",
        },
      ],
      lunch_deals: [
        {
          id: "fallback_1",
          title: "Lunch sorted",
          body: `Deals nearby right now. Grab something good.`,
          tone: "playful",
          hasEmoji: false,
          urgencyLevel: "medium",
        },
      ],
      weekly_summary: [
        {
          id: "fallback_1",
          title: "Your week in review",
          body: "See how your business performed this week.",
          tone: "coach",
          hasEmoji: false,
          urgencyLevel: "low",
        },
      ],
    };

    return fallbacks[triggerType] || fallbacks.offer_expiring;
  }
}
