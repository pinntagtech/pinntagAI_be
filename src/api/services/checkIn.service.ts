import OpenAI from "openai";
import { logger } from "../../utils/logger.js";
import { BusinessAIAssistantModel } from "../../models/businessAIAssistant.model.js";
import { UsageTrackingService } from "./usageTracking.service.js";
import { UsageType } from "../../models/aiUsage.model.js";
import { ApiError } from "../controllers/controller.utils.js";
import { openai } from "../../utils/openai.js";

// ===========================
// Types
// ===========================

export interface CheckInContext {
  businessId: string;
}

export interface CheckInTitleResponse {
  success: boolean;
  suggestions: string[];
  metadata?: {
    businessName: string;
    generatedAt: string;
  };
}

// ===========================
// Service Class
// ===========================

export class CheckInService {
  /**
   * Generate AI-suggested titles for check-ins based on business metadata
   */
  static async generateCheckInTitles(
    context: CheckInContext,
    count: number = 10,
  ): Promise<CheckInTitleResponse> {
    try {
      const { businessId } = context;

      // Get business AI assistant info
      const businessAI = await BusinessAIAssistantModel.findOne({
        businessId,
      });

      if (!businessAI) {
        throw ApiError.badRequest(
          "Business AI assistant not found. Please create an agent first.",
          "BUSINESS_NOT_FOUND"
        );
      }

      // Build the prompt for title generation using business metadata
      const prompt = this.buildTitlePrompt(
        businessAI.businessName,
        businessAI.description || "",
        businessAI.category,
        businessAI.subCategories || [],
        businessAI.tags || [],
        count,
      );

      logger.info(
        { businessId, count },
        "Generating check-in titles from business metadata",
      );

      // Create a thread for this conversation
      const thread = await openai.beta.threads.create();

      // Add the message
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt,
      });

      // Run with the business assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: businessAI.assistantId,
      });

      // Poll until completion
      const finalRun = await this.pollRunUntilComplete(thread.id, run.id);

      // Get the response
      const messages = await openai.beta.threads.messages.list(thread.id, {
        limit: 10,
      });

      const lastMessage = messages.data.find((m) => m.role === "assistant");
      const responseText =
        lastMessage?.content
          ?.map((c) => (c.type === "text" ? c.text.value : ""))
          .join("\n") ?? "";

      // Parse the response
      const suggestions = this.parseTitleSuggestions(responseText, count);

      // Track usage
      await UsageTrackingService.trackUsage({
        businessId,
        type: UsageType.CONTENT_GENERATION,
        subType: "check_in_titles",
        promptTokens: finalRun.usage?.prompt_tokens || 0,
        completionTokens: finalRun.usage?.completion_tokens || 0,
        totalTokens: finalRun.usage?.total_tokens || 0,
        model: "gpt-4o",
        success: true,
        metadata: {
          threadId: thread.id,
          runId: finalRun.id,
          suggestionsCount: suggestions.length,
        },
      });

      logger.info(
        { businessId, suggestionsCount: suggestions.length },
        "Check-in titles generated successfully",
      );

      return {
        success: true,
        suggestions,
        metadata: {
          businessName: businessAI.businessName,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error(
        { error: error.message },
        "Error generating check-in titles",
      );
      throw error;
    }
  }

  /**
   * Build the prompt for title generation based on business metadata
   */
  private static buildTitlePrompt(
    businessName: string,
    description: string,
    category: string,
    subCategories: string[],
    tags: string[],
    count: number = 10,
  ): string {
    const prompt = `Generate exactly ${count} two-word atmospheric mood phrases to be used as check-in titles for this business.

BUSINESS INFORMATION:
- Name: ${businessName}
- Description: ${description}
- Category: ${category}
- Sub-categories: ${subCategories.join(", ") || "N/A"}
- Tags: ${tags.join(", ") || "N/A"}

TITLE REQUIREMENTS (VERY IMPORTANT):
1. Each title MUST be exactly TWO WORDS describing the ATMOSPHERE, MOOD, or VIBE.
   - The phrase should feel natural and evocative (e.g., "Good Vibes", "Pure Bliss").
   - Do NOT use physical product descriptors (e.g., avoid "Cheesy Bites", "Crispy Crust").
   - DO use feeling/mood phrases (e.g., "Golden Hour", "Pure Bliss", "Good Vibes").
2. Each title MUST be exactly 2 words (no more, no less).
3. Each title MUST include ONE relevant emoji.
4. Titles must match the specific vibe of the business (e.g., a spa should be calming, a club should be energetic).

EXAMPLES FOR REFERENCE:
- For a luxury restaurant: "Golden Hour ✨", "Pure Elegance 🍷", "Fine Dining 🍽️"
- For a nature retreat: "Pure Serenity 🍃", "Wild Escape 🌿", "Deep Calm 🪵"
- For a lively gym/club: "Full Send ⚡", "High Energy 🎵", "Raw Power 🔥"

Please provide exactly ${count} title suggestions in the following JSON format:
{
  "titles": [
    {"title": "Golden Hour", "emoji": "✨"},
    {"title": "Pure Bliss", "emoji": "🌊"},
    {"title": "Good Vibes", "emoji": "🥂"}
  ]
}

CRITICAL:
- Title text must be exactly 2 words (not counting the emoji)
- Phrases must be MOOD/ATMOSPHERIC and feel natural
- Return ONLY the JSON object, no additional text
- Generate exactly ${count} unique titles`;

    return prompt;
  }

  /**
   * Parse title suggestions from AI response
   */
  private static parseTitleSuggestions(
    responseText: string,
    expectedCount: number,
  ): string[] {
    try {
      // Try to parse as JSON first
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.titles && Array.isArray(parsed.titles)) {
          const validTitles = parsed.titles
            .filter((item: any) => {
              // Validate that title is exactly 2 words and has emoji
              const wordCount = item.title?.trim().split(/\s+/).length || 0;
              return item.title && item.emoji && wordCount === 2;
            })
            .map((item: any) => `${item.title.trim()} ${item.emoji}`);

          if (validTitles.length >= expectedCount) {
            return validTitles.slice(0, expectedCount);
          }

          // If we don't have enough valid titles, supplement with defaults
          const needed = expectedCount - validTitles.length;
          const defaults = this.getDefaultTitles(needed);
          return [...validTitles, ...defaults].slice(0, expectedCount);
        }
      }

      // If JSON parsing failed, return defaults
      logger.warn("Failed to parse JSON response, using default titles");
      return this.getDefaultTitles(expectedCount);
    } catch (error) {
      logger.error(
        { error },
        "Error parsing title suggestions, using defaults",
      );
      return this.getDefaultTitles(expectedCount);
    }
  }

  /**
   * Get default title suggestions
   */
  private static getDefaultTitles(count: number): string[] {
    const defaults: string[] = [
      "Good Vibes ✨",
      "Pure Bliss 🎵",
      "Great Times ❤️",
      "Chill Mode 😎",
      "Simply Perfect 👌",
      "Feeling Amazing 🌟",
      "Golden Hour ⭐",
      "High Spirits 🔥",
      "Full Joy 🙏",
      "Top Notch 💫",
    ];

    return defaults.slice(0, count);
  }

  /**
   * Poll until the run is complete
   */
  private static async pollRunUntilComplete(
    threadId: string,
    runId: string,
    maxAttempts: number = 30,
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
          `Run ${run.status}: ${run.last_error?.message || "Unknown error"}`,
        );
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error("Run timed out");
  }
}
