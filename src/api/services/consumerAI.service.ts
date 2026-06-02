import mongoose from "mongoose";
import { randomUUID } from "crypto";
import {
  ConsumerAIProfileModel,
  IConsumerAIProfile,
  IConversation,
  IChatMessage,
  MessageRole,
  IUserPreferences,
} from "../../models/consumerAI.model.js";
import { EngagementModel, EngagementActionType } from "../../models/engagement.model.js";
import { logger } from "../../utils/logger.js";
import { llm } from "../../utils/llm.js";

/**
 * Input for chat message
 */
export interface ChatInput {
  userId: string;
  message: string;
  sessionId?: string; // If not provided, creates new session
  location?: {
    city?: string;
    state?: string;
    coordinates?: { lat: number; lng: number };
  };
}

/**
 * Chat response
 */
export interface ChatResponse {
  sessionId: string;
  response: string;
  eventsRecommended?: Array<{
    eventId: string;
    reason: string;
  }>;
  suggestedFollowUps?: string[];
  metadata?: {
    tokensUsed: number;
    preferencesUpdated: boolean;
  };
}

/**
 * Consumer AI Service - Chat completions with cross-chat referencing
 */
class ConsumerAIService {
  private readonly MAX_CONTEXT_MESSAGES = 10; // Messages to include from current conversation
  private readonly MAX_CONVERSATION_SUMMARIES = 5; // Past conversations to reference
  private readonly MODEL = "gpt-4o-mini"; // Cost-effective model for consumer chat

  /**
   * Main chat method - handles user messages with full context
   */
  async chat(input: ChatInput): Promise<ChatResponse> {
    try {
      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(input.userId)) {
        throw new Error("Invalid userId format");
      }

      // Get or create user profile
      const profile = await ConsumerAIProfileModel.getOrCreateProfile(
        input.userId
      );

      // Get or create conversation session
      const sessionId = input.sessionId || randomUUID();
      let conversation = profile.conversations.find(
        (c) => c.sessionId === sessionId
      );

      if (!conversation) {
        conversation = {
          sessionId,
          messages: [],
          topics: [],
          startedAt: new Date(),
          lastMessageAt: new Date(),
          messageCount: 0,
        };
        profile.conversations.push(conversation);
      }

      // Add user message to conversation
      const userMessage: IChatMessage = {
        role: MessageRole.USER,
        content: input.message,
        timestamp: new Date(),
        metadata: {
          intentDetected: this.detectIntent(input.message),
        },
      };
      conversation.messages.push(userMessage);
      conversation.lastMessageAt = new Date();

      // Build the messages array for OpenAI
      const messages = await this.buildChatMessages(
        profile,
        conversation,
        input
      );

      // Call OpenAI Chat Completions API
      const completion = await llm.chatCompletion({
        model: this.MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantResponse =
        completion.choices[0]?.message?.content || "I apologize, I couldn't generate a response.";

      // Add assistant message to conversation
      const assistantMessage: IChatMessage = {
        role: MessageRole.ASSISTANT,
        content: assistantResponse,
        timestamp: new Date(),
      };
      conversation.messages.push(assistantMessage);

      // Extract any preferences or facts from the conversation
      await this.extractAndUpdateContext(profile, input.message, assistantResponse);

      // Trim old conversations if needed (keep last 50)
      if (profile.conversations.length > 50) {
        // Summarize old conversations before removing
        await this.summarizeAndArchiveOldConversations(profile);
      }

      // Save profile
      await profile.save();

      logger.info(
        {
          userId: input.userId,
          sessionId,
          messageLength: input.message.length,
        },
        "Consumer AI chat completed"
      );

      return {
        sessionId,
        response: assistantResponse,
        metadata: {
          tokensUsed: completion.usage?.total_tokens || 0,
          preferencesUpdated: false,
        },
      };
    } catch (error: any) {
      logger.error(
        { error: error.message, userId: input.userId },
        "Consumer AI chat failed"
      );
      throw error;
    }
  }

  /**
   * Build the complete messages array for OpenAI with cross-chat context
   */
  private async buildChatMessages(
    profile: IConsumerAIProfile,
    currentConversation: IConversation,
    input: ChatInput
  ): Promise<Array<{ role: "system" | "user" | "assistant"; content: string }>> {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    // 1. System prompt with user preferences and cross-chat context
    const systemPrompt = await this.buildSystemPrompt(profile, input);
    messages.push({ role: "system", content: systemPrompt });

    // 2. Cross-chat context summary (if any previous conversations)
    if (profile.crossChatContext.recentConversationSummaries.length > 0) {
      const crossChatContext = this.buildCrossChatContext(profile);
      messages.push({ role: "system", content: crossChatContext });
    }

    // 3. Current conversation messages (limited to recent)
    const recentMessages = currentConversation.messages.slice(
      -this.MAX_CONTEXT_MESSAGES
    );
    for (const msg of recentMessages) {
      if (msg.role === MessageRole.USER) {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.role === MessageRole.ASSISTANT) {
        messages.push({ role: "assistant", content: msg.content });
      }
    }

    return messages;
  }

  /**
   * Build the system prompt with user preferences
   */
  private async buildSystemPrompt(
    profile: IConsumerAIProfile,
    input: ChatInput
  ): Promise<string> {
    const prefs = profile.preferences;

    let prompt = `You are a friendly and helpful AI assistant for PinnTag, a local events and deals discovery app. Your role is to help users discover events, deals, offers, and local experiences that match their interests.

# Your Personality
- Be conversational, warm, and enthusiastic about helping users find great experiences
- Remember details from previous conversations and reference them naturally
- Be proactive in suggesting relevant events and deals
- Ask clarifying questions when needed to give better recommendations
- Keep responses concise but informative

# Current Date/Time
${new Date().toLocaleString()}

# User Location
${input.location?.city ? `City: ${input.location.city}` : "Not specified"}
${input.location?.state ? `State: ${input.location.state}` : ""}

# User Profile & Preferences
`;

    // Add category preferences
    if (prefs.favoriteCategories && prefs.favoriteCategories.length > 0) {
      const topCategories = prefs.favoriteCategories
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((c) => c.categoryName);
      prompt += `- Favorite Categories: ${topCategories.join(", ")}\n`;
    }

    // Add location preferences
    if (prefs.preferredLocations && prefs.preferredLocations.length > 0) {
      const topLocations = prefs.preferredLocations
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((l) => l.city);
      prompt += `- Preferred Locations: ${topLocations.join(", ")}\n`;
    }

    // Add time preferences
    if (prefs.preferredTimes) {
      const times = [];
      if (prefs.preferredTimes.weekends) times.push("weekends");
      if (prefs.preferredTimes.weekdays) times.push("weekdays");
      if (prefs.preferredTimes.evenings) times.push("evenings");
      if (prefs.preferredTimes.mornings) times.push("mornings");
      if (times.length > 0) {
        prompt += `- Preferred Times: ${times.join(", ")}\n`;
      }
    }

    // Add price sensitivity
    const priceLevels = ["very price-conscious", "price-conscious", "moderate", "flexible", "not price-sensitive"];
    prompt += `- Price Sensitivity: ${priceLevels[(prefs.priceSensitivity || 3) - 1]}\n`;

    // Add dietary preferences
    if (prefs.dietaryPreferences && prefs.dietaryPreferences.length > 0) {
      prompt += `- Dietary Preferences: ${prefs.dietaryPreferences.join(", ")}\n`;
    }

    // Add explicit preferences
    if (prefs.explicitPreferences) {
      if (prefs.explicitPreferences.interests?.length > 0) {
        prompt += `- Stated Interests: ${prefs.explicitPreferences.interests.join(", ")}\n`;
      }
      if (prefs.explicitPreferences.dislikes?.length > 0) {
        prompt += `- Dislikes/Avoid: ${prefs.explicitPreferences.dislikes.join(", ")}\n`;
      }
    }

    // Add user facts
    if (profile.crossChatContext.userFacts.length > 0) {
      prompt += "\n# Known Facts About This User\n";
      const facts = profile.crossChatContext.userFacts
        .filter((f) => f.confidence > 0.6)
        .slice(0, 10);
      for (const fact of facts) {
        prompt += `- ${fact.fact}\n`;
      }
    }

    // Add pending follow-ups
    const pendingFollowUps = profile.crossChatContext.pendingFollowUps.filter(
      (f) => !f.resolved
    );
    if (pendingFollowUps.length > 0) {
      prompt += "\n# Pending Items to Follow Up On\n";
      for (const followUp of pendingFollowUps.slice(0, 3)) {
        prompt += `- ${followUp.type}: ${followUp.content}\n`;
      }
    }

    prompt += `
# Guidelines
1. When recommending events/deals, explain WHY they match the user's preferences
2. If the user mentions new interests, acknowledge and remember them
3. Reference previous conversations naturally (e.g., "Last time you mentioned...")
4. Suggest follow-up questions to learn more about their preferences
5. If you don't have enough info, ask clarifying questions
6. Always be enthusiastic about helping them discover great local experiences
7. When they ask about something specific, provide detailed helpful information

Remember: You're building a relationship with this user. Reference what you know about them to make conversations feel personal and connected.`;

    return prompt;
  }

  /**
   * Build cross-chat context from previous conversations
   */
  private buildCrossChatContext(profile: IConsumerAIProfile): string {
    let context = "# Previous Conversation Context\n\n";

    // Add recent conversation summaries
    const summaries = profile.crossChatContext.recentConversationSummaries
      .slice(-this.MAX_CONVERSATION_SUMMARIES)
      .reverse();

    if (summaries.length > 0) {
      context += "## Recent Conversation Summaries\n";
      for (const summary of summaries) {
        const date = new Date(summary.date).toLocaleDateString();
        context += `- [${date}] ${summary.summary}\n`;
        if (summary.topics.length > 0) {
          context += `  Topics: ${summary.topics.join(", ")}\n`;
        }
      }
      context += "\n";
    }

    // Add recently mentioned entities
    const recentEntities = profile.crossChatContext.mentionedEntities
      .sort((a, b) => new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime())
      .slice(0, 10);

    if (recentEntities.length > 0) {
      context += "## Recently Discussed\n";
      for (const entity of recentEntities) {
        context += `- ${entity.entityType}: ${entity.entityName}`;
        if (entity.context) {
          context += ` (${entity.context})`;
        }
        context += "\n";
      }
    }

    return context;
  }

  /**
   * Extract preferences and facts from conversation to update context
   */
  private async extractAndUpdateContext(
    profile: IConsumerAIProfile,
    userMessage: string,
    assistantResponse: string
  ): Promise<void> {
    // Simple extraction rules (in production, could use AI for this)
    const lowerMessage = userMessage.toLowerCase();

    // Extract explicit likes
    const likePatterns = [
      /i (love|like|enjoy|prefer) (.+)/i,
      /i'm (interested in|looking for) (.+)/i,
      /i want (.+)/i,
    ];

    for (const pattern of likePatterns) {
      const match = lowerMessage.match(pattern);
      if (match && match[2]) {
        const interest = match[2].trim().split(/[,.]/)[ 0];
        if (interest.length > 2 && interest.length < 50) {
          // Add as user fact
          const existingFact = profile.crossChatContext.userFacts.find(
            (f) => f.fact.toLowerCase().includes(interest.toLowerCase())
          );
          if (!existingFact) {
            profile.crossChatContext.userFacts.push({
              fact: `User ${match[1]} ${interest}`,
              source: "explicit",
              confidence: 0.9,
              learnedAt: new Date(),
            });
          }
        }
      }
    }

    // Extract dislikes
    const dislikePatterns = [
      /i (don't like|hate|dislike|avoid) (.+)/i,
      /i'm not (interested in|a fan of) (.+)/i,
    ];

    for (const pattern of dislikePatterns) {
      const match = lowerMessage.match(pattern);
      if (match && match[2]) {
        const dislike = match[2].trim().split(/[,.]/)[ 0];
        if (dislike.length > 2 && dislike.length < 50) {
          if (!profile.preferences.explicitPreferences.dislikes.includes(dislike)) {
            profile.preferences.explicitPreferences.dislikes.push(dislike);
          }
        }
      }
    }

    // Limit facts to prevent unbounded growth
    if (profile.crossChatContext.userFacts.length > 50) {
      // Keep most recent and highest confidence
      profile.crossChatContext.userFacts = profile.crossChatContext.userFacts
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 40);
    }
  }

  /**
   * Summarize and archive old conversations
   */
  private async summarizeAndArchiveOldConversations(
    profile: IConsumerAIProfile
  ): Promise<void> {
    // Keep the 30 most recent conversations
    const conversationsToKeep = 30;
    const conversationsToSummarize = profile.conversations.slice(
      0,
      -conversationsToKeep
    );

    for (const conv of conversationsToSummarize) {
      if (conv.messages.length > 0 && !conv.summary) {
        // Generate summary using AI (simplified version)
        const messagesText = conv.messages
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n");

        try {
          const summaryResponse = await llm.chatCompletion({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "Summarize this conversation in 1-2 sentences, focusing on what the user was looking for and any key preferences mentioned.",
              },
              {
                role: "user",
                content: messagesText.slice(0, 2000), // Limit context
              },
            ],
            max_tokens: 100,
          });

          conv.summary = summaryResponse.choices[0]?.message?.content || "";

          // Add to cross-chat context
          profile.crossChatContext.recentConversationSummaries.push({
            sessionId: conv.sessionId,
            summary: conv.summary,
            topics: conv.topics,
            date: conv.startedAt,
          });
        } catch (error) {
          logger.warn(
            { error, sessionId: conv.sessionId },
            "Failed to summarize conversation"
          );
        }
      }
    }

    // Remove old conversations but keep summaries
    profile.conversations = profile.conversations.slice(-conversationsToKeep);

    // Limit summaries
    if (profile.crossChatContext.recentConversationSummaries.length > 20) {
      profile.crossChatContext.recentConversationSummaries =
        profile.crossChatContext.recentConversationSummaries.slice(-20);
    }
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes("recommend") || lower.includes("suggest") || lower.includes("what should")) {
      return "recommendation";
    }
    if (lower.includes("find") || lower.includes("search") || lower.includes("looking for")) {
      return "search";
    }
    if (lower.includes("?") || lower.includes("what") || lower.includes("how") || lower.includes("when")) {
      return "question";
    }
    if (lower.includes("thanks") || lower.includes("thank you")) {
      return "gratitude";
    }
    if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
      return "greeting";
    }

    return "general";
  }

  /**
   * Update preferences from engagement data
   */
  async updatePreferencesFromEngagement(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId format");
    }

    const profile = await ConsumerAIProfileModel.getOrCreateProfile(userId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Aggregate engagement data to update preferences
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get engagement counts by action type
    const engagementStats = await EngagementModel.aggregate([
      {
        $match: {
          userId: userObjId,
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: "$actionType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get location preferences from engagement
    const locationStats = await EngagementModel.aggregate([
      {
        $match: {
          userId: userObjId,
          "location.city": { $exists: true },
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: "$location.city",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Update location preferences
    for (const loc of locationStats) {
      const existing = profile.preferences.preferredLocations.find(
        (l) => l.city === loc._id
      );
      const score = Math.min(100, loc.count * 10);

      if (existing) {
        existing.score = Math.max(existing.score, score);
      } else {
        profile.preferences.preferredLocations.push({
          city: loc._id,
          score,
        });
      }
    }

    // Get time preferences from engagement
    const timeStats = await EngagementModel.aggregate([
      {
        $match: {
          userId: userObjId,
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$createdAt" },
            hour: { $hour: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Analyze time patterns
    let weekdayCount = 0;
    let weekendCount = 0;
    let morningCount = 0;
    let afternoonCount = 0;
    let eveningCount = 0;
    let lateNightCount = 0;

    for (const stat of timeStats) {
      const day = stat._id.dayOfWeek;
      const hour = stat._id.hour;
      const count = stat.count;

      // Weekday vs weekend
      if (day >= 2 && day <= 6) {
        weekdayCount += count;
      } else {
        weekendCount += count;
      }

      // Time of day
      if (hour >= 6 && hour < 12) {
        morningCount += count;
      } else if (hour >= 12 && hour < 18) {
        afternoonCount += count;
      } else if (hour >= 18 && hour < 22) {
        eveningCount += count;
      } else {
        lateNightCount += count;
      }
    }

    // Update time preferences (set true if significant activity)
    const total = weekdayCount + weekendCount;
    if (total > 0) {
      profile.preferences.preferredTimes.weekdays = weekdayCount / total > 0.3;
      profile.preferences.preferredTimes.weekends = weekendCount / total > 0.3;
    }

    const timeTotal = morningCount + afternoonCount + eveningCount + lateNightCount;
    if (timeTotal > 0) {
      profile.preferences.preferredTimes.mornings = morningCount / timeTotal > 0.2;
      profile.preferences.preferredTimes.afternoons = afternoonCount / timeTotal > 0.2;
      profile.preferences.preferredTimes.evenings = eveningCount / timeTotal > 0.2;
      profile.preferences.preferredTimes.lateNight = lateNightCount / timeTotal > 0.1;
    }

    await profile.save();

    logger.info(
      { userId, locationsLearned: locationStats.length },
      "Updated consumer preferences from engagement"
    );
  }

  /**
   * Get user profile summary
   */
  async getProfileSummary(userId: string): Promise<{
    preferences: IUserPreferences;
    stats: {
      totalConversations: number;
      totalMessages: number;
      lastActiveAt: Date;
      knownFacts: number;
    };
    recentTopics: string[];
  }> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId format");
    }

    const profile = await ConsumerAIProfileModel.getOrCreateProfile(userId);

    // Get recent topics from conversations
    const recentTopics = new Set<string>();
    for (const conv of profile.conversations.slice(-10)) {
      for (const topic of conv.topics) {
        recentTopics.add(topic);
      }
    }

    return {
      preferences: profile.preferences,
      stats: {
        totalConversations: profile.totalConversations,
        totalMessages: profile.totalMessages,
        lastActiveAt: profile.lastActiveAt,
        knownFacts: profile.crossChatContext.userFacts.length,
      },
      recentTopics: Array.from(recentTopics).slice(0, 10),
    };
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    userId: string,
    sessionId?: string,
    limit: number = 10
  ): Promise<IConversation[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId format");
    }

    const profile = await ConsumerAIProfileModel.getOrCreateProfile(userId);

    if (sessionId) {
      const conv = profile.conversations.find((c) => c.sessionId === sessionId);
      return conv ? [conv] : [];
    }

    return profile.conversations
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      .slice(0, limit);
  }

  /**
   * Clear conversation history (for privacy)
   */
  async clearHistory(userId: string, sessionId?: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId format");
    }

    const profile = await ConsumerAIProfileModel.getOrCreateProfile(userId);

    if (sessionId) {
      profile.conversations = profile.conversations.filter(
        (c) => c.sessionId !== sessionId
      );
    } else {
      profile.conversations = [];
      profile.crossChatContext.recentConversationSummaries = [];
    }

    await profile.save();

    logger.info(
      { userId, sessionId },
      "Cleared consumer conversation history"
    );
  }

  /**
   * Add explicit user preference
   */
  async addExplicitPreference(
    userId: string,
    type: "interest" | "dislike",
    value: string
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId format");
    }

    const profile = await ConsumerAIProfileModel.getOrCreateProfile(userId);

    if (type === "interest") {
      if (!profile.preferences.explicitPreferences.interests.includes(value)) {
        profile.preferences.explicitPreferences.interests.push(value);
      }
    } else {
      if (!profile.preferences.explicitPreferences.dislikes.includes(value)) {
        profile.preferences.explicitPreferences.dislikes.push(value);
      }
    }

    await profile.save();
  }
}

export const consumerAIService = new ConsumerAIService();
