import mongoose from "mongoose";
import {
  AIUsageModel,
  IAIUsage,
  IUsageRecord,
  UsageType,
  ContentGenerationType,
  getOrCreateUsageRecord,
  shouldResetPeriod,
  getDateString,
  getMonthString,
} from "../../models/aiUsage.model.js";
import { logger } from "../../utils/logger.js";

// ===========================
// Types
// ===========================

export interface TrackUsageParams {
  businessId: string;
  type: UsageType;
  subType?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  imageCount?: number;
  model?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface UsageSummary {
  currentPeriod: {
    startDate: Date;
    imagesGenerated: number;
    contentGenerations: number;
    tokensUsed: number;
  };
  lifetime: {
    totalImagesGenerated: number;
    totalContentGenerations: number;
    totalTokensUsed: number;
    totalChats: number;
    totalAgentQueries: number;
  };
  today: {
    contentGenerations: number;
    imageGenerations: number;
    tokensUsed: number;
  };
  thisMonth: {
    contentGenerations: number;
    imageGenerations: number;
    tokensUsed: number;
  };
}

export interface UsageAnalytics {
  dailyBreakdown: Array<{
    date: string;
    contentGenerations: number;
    imageGenerations: number;
    totalTokens: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    contentGenerations: number;
    imageGenerations: number;
    totalTokens: number;
  }>;
  byType: {
    broadcast: number;
    offer: number;
    reward: number;
    event: number;
    improve: number;
  };
  topModels: Array<{
    model: string;
    count: number;
    tokens: number;
  }>;
}

// ===========================
// Usage Tracking Service
// ===========================

export class UsageTrackingService {
  /**
   * Track a usage event
   */
  static async trackUsage(params: TrackUsageParams): Promise<void> {
    try {
      const {
        businessId,
        type,
        subType,
        promptTokens = 0,
        completionTokens = 0,
        totalTokens = promptTokens + completionTokens,
        imageCount = 0,
        model,
        success = true,
        errorMessage,
        metadata,
      } = params;

      const usage = await getOrCreateUsageRecord(businessId);
      const now = new Date();
      const dateStr = getDateString(now);
      const monthStr = getMonthString(now);

      // Check if period needs reset
      if (shouldResetPeriod(usage.currentPeriodStart)) {
        usage.currentPeriodStart = now;
        usage.imagesGeneratedThisPeriod = 0;
        usage.contentGenerationsThisPeriod = 0;
        usage.tokensUsedThisPeriod = 0;
      }

      // Create usage record
      const record: IUsageRecord = {
        timestamp: now,
        type,
        subType,
        promptTokens,
        completionTokens,
        totalTokens,
        imageCount,
        model,
        success,
        errorMessage,
        metadata,
      };

      // Update counters based on type
      if (success) {
        usage.tokensUsedThisPeriod += totalTokens;
        usage.totalTokensUsed += totalTokens;

        switch (type) {
          case UsageType.CONTENT_GENERATION:
            usage.contentGenerationsThisPeriod += 1;
            usage.totalContentGenerations += 1;
            break;
          case UsageType.IMAGE_GENERATION:
            usage.imagesGeneratedThisPeriod += imageCount || 1;
            usage.totalImagesGenerated += imageCount || 1;
            break;
          case UsageType.IMAGE_EDIT:
            usage.imagesGeneratedThisPeriod += 1;
            usage.totalImagesGenerated += 1;
            break;
          case UsageType.CHAT:
            usage.totalChats += 1;
            break;
          case UsageType.AGENT_QUERY:
            usage.totalAgentQueries += 1;
            break;
        }
      }

      // Add to usage records (keep last 1000)
      usage.usageRecords.push(record);
      if (usage.usageRecords.length > 1000) {
        usage.usageRecords = usage.usageRecords.slice(-1000);
      }

      // Update daily usage
      await this.updateDailyUsage(usage, dateStr, record);

      // Update monthly usage
      await this.updateMonthlyUsage(usage, monthStr, record);

      await usage.save();

      logger.debug(
        { businessId, type, subType, totalTokens, imageCount },
        "Usage tracked"
      );
    } catch (error: any) {
      logger.error(
        { businessId: params.businessId, error: error.message },
        "Error tracking usage"
      );
      // Don't throw - usage tracking should not break main functionality
    }
  }

  /**
   * Update daily usage aggregation
   */
  private static async updateDailyUsage(
    usage: IAIUsage,
    dateStr: string,
    record: IUsageRecord
  ): Promise<void> {
    let dailyEntry = usage.dailyUsage.find((d) => d.date === dateStr);

    if (!dailyEntry) {
      dailyEntry = {
        date: dateStr,
        contentGenerations: 0,
        imageGenerations: 0,
        imageEdits: 0,
        chats: 0,
        agentQueries: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
      };
      usage.dailyUsage.push(dailyEntry);

      // Keep only last 90 days
      if (usage.dailyUsage.length > 90) {
        usage.dailyUsage = usage.dailyUsage.slice(-90);
      }
    }

    if (record.success) {
      dailyEntry.totalTokens += record.totalTokens || 0;
      dailyEntry.promptTokens += record.promptTokens || 0;
      dailyEntry.completionTokens += record.completionTokens || 0;

      switch (record.type) {
        case UsageType.CONTENT_GENERATION:
          dailyEntry.contentGenerations += 1;
          break;
        case UsageType.IMAGE_GENERATION:
          dailyEntry.imageGenerations += record.imageCount || 1;
          break;
        case UsageType.IMAGE_EDIT:
          dailyEntry.imageEdits += 1;
          break;
        case UsageType.CHAT:
          dailyEntry.chats += 1;
          break;
        case UsageType.AGENT_QUERY:
          dailyEntry.agentQueries += 1;
          break;
      }
    }
  }

  /**
   * Update monthly usage aggregation
   */
  private static async updateMonthlyUsage(
    usage: IAIUsage,
    monthStr: string,
    record: IUsageRecord
  ): Promise<void> {
    let monthlyEntry = usage.monthlyUsage.find((m) => m.month === monthStr);

    if (!monthlyEntry) {
      monthlyEntry = {
        month: monthStr,
        contentGenerations: 0,
        imageGenerations: 0,
        imageEdits: 0,
        chats: 0,
        agentQueries: 0,
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
      };
      usage.monthlyUsage.push(monthlyEntry);

      // Keep only last 24 months
      if (usage.monthlyUsage.length > 24) {
        usage.monthlyUsage = usage.monthlyUsage.slice(-24);
      }
    }

    if (record.success) {
      monthlyEntry.totalTokens += record.totalTokens || 0;
      monthlyEntry.promptTokens += record.promptTokens || 0;
      monthlyEntry.completionTokens += record.completionTokens || 0;

      switch (record.type) {
        case UsageType.CONTENT_GENERATION:
          monthlyEntry.contentGenerations += 1;
          break;
        case UsageType.IMAGE_GENERATION:
          monthlyEntry.imageGenerations += record.imageCount || 1;
          break;
        case UsageType.IMAGE_EDIT:
          monthlyEntry.imageEdits += 1;
          break;
        case UsageType.CHAT:
          monthlyEntry.chats += 1;
          break;
        case UsageType.AGENT_QUERY:
          monthlyEntry.agentQueries += 1;
          break;
      }
    }
  }

  /**
   * Get usage summary for a business
   */
  static async getUsageSummary(businessId: string): Promise<UsageSummary> {
    const usage = await getOrCreateUsageRecord(businessId);
    const today = getDateString();
    const thisMonth = getMonthString();

    const todayUsage = usage.dailyUsage.find((d) => d.date === today);
    const monthUsage = usage.monthlyUsage.find((m) => m.month === thisMonth);

    return {
      currentPeriod: {
        startDate: usage.currentPeriodStart,
        imagesGenerated: usage.imagesGeneratedThisPeriod,
        contentGenerations: usage.contentGenerationsThisPeriod,
        tokensUsed: usage.tokensUsedThisPeriod,
      },
      lifetime: {
        totalImagesGenerated: usage.totalImagesGenerated,
        totalContentGenerations: usage.totalContentGenerations,
        totalTokensUsed: usage.totalTokensUsed,
        totalChats: usage.totalChats,
        totalAgentQueries: usage.totalAgentQueries,
      },
      today: {
        contentGenerations: todayUsage?.contentGenerations || 0,
        imageGenerations: todayUsage?.imageGenerations || 0,
        tokensUsed: todayUsage?.totalTokens || 0,
      },
      thisMonth: {
        contentGenerations: monthUsage?.contentGenerations || 0,
        imageGenerations: monthUsage?.imageGenerations || 0,
        tokensUsed: monthUsage?.totalTokens || 0,
      },
    };
  }

  /**
   * Get detailed usage analytics
   */
  static async getUsageAnalytics(
    businessId: string,
    days: number = 30
  ): Promise<UsageAnalytics> {
    const usage = await getOrCreateUsageRecord(businessId);

    // Get daily breakdown for specified days
    const dailyBreakdown = usage.dailyUsage
      .slice(-days)
      .map((d) => ({
        date: d.date,
        contentGenerations: d.contentGenerations,
        imageGenerations: d.imageGenerations,
        totalTokens: d.totalTokens,
      }));

    // Get monthly breakdown
    const monthlyBreakdown = usage.monthlyUsage.map((m) => ({
      month: m.month,
      contentGenerations: m.contentGenerations,
      imageGenerations: m.imageGenerations,
      totalTokens: m.totalTokens,
    }));

    // Count by content type
    const byType = {
      broadcast: 0,
      offer: 0,
      reward: 0,
      event: 0,
      improve: 0,
    };

    // Aggregate model usage
    const modelUsage: Record<string, { count: number; tokens: number }> = {};

    for (const record of usage.usageRecords) {
      // Count by subtype
      if (record.type === UsageType.CONTENT_GENERATION && record.subType) {
        const subType = record.subType as keyof typeof byType;
        if (subType in byType) {
          byType[subType] += 1;
        }
      }

      // Aggregate by model
      if (record.model) {
        if (!modelUsage[record.model]) {
          modelUsage[record.model] = { count: 0, tokens: 0 };
        }
        modelUsage[record.model].count += 1;
        modelUsage[record.model].tokens += record.totalTokens || 0;
      }
    }

    // Convert model usage to sorted array
    const topModels = Object.entries(modelUsage)
      .map(([model, data]) => ({
        model,
        count: data.count,
        tokens: data.tokens,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      dailyBreakdown,
      monthlyBreakdown,
      byType,
      topModels,
    };
  }

  /**
   * Get recent usage records
   */
  static async getRecentUsage(
    businessId: string,
    limit: number = 50
  ): Promise<IUsageRecord[]> {
    const usage = await getOrCreateUsageRecord(businessId);
    return usage.usageRecords.slice(-limit).reverse();
  }

  /**
   * Get images generated this period
   */
  static async getImagesGeneratedThisPeriod(
    businessId: string
  ): Promise<number> {
    const usage = await getOrCreateUsageRecord(businessId);

    // Reset if needed
    if (shouldResetPeriod(usage.currentPeriodStart)) {
      return 0;
    }

    return usage.imagesGeneratedThisPeriod;
  }

  /**
   * Get content generations today
   */
  static async getContentGenerationsToday(businessId: string): Promise<number> {
    const usage = await getOrCreateUsageRecord(businessId);
    const today = getDateString();
    const todayUsage = usage.dailyUsage.find((d) => d.date === today);
    return todayUsage?.contentGenerations || 0;
  }

  /**
   * Check if business has exceeded limits
   */
  static async checkLimits(
    businessId: string,
    limits: {
      maxImagesPerMonth?: number;
      maxContentPerDay?: number;
      maxTokensPerMonth?: number;
    }
  ): Promise<{
    imagesExceeded: boolean;
    contentExceeded: boolean;
    tokensExceeded: boolean;
    usage: {
      imagesThisPeriod: number;
      contentToday: number;
      tokensThisPeriod: number;
    };
  }> {
    const usage = await getOrCreateUsageRecord(businessId);
    const today = getDateString();
    const todayUsage = usage.dailyUsage.find((d) => d.date === today);

    // Reset period counters if needed
    let imagesThisPeriod = usage.imagesGeneratedThisPeriod;
    let tokensThisPeriod = usage.tokensUsedThisPeriod;
    if (shouldResetPeriod(usage.currentPeriodStart)) {
      imagesThisPeriod = 0;
      tokensThisPeriod = 0;
    }

    const contentToday = todayUsage?.contentGenerations || 0;

    return {
      imagesExceeded: limits.maxImagesPerMonth
        ? imagesThisPeriod >= limits.maxImagesPerMonth
        : false,
      contentExceeded: limits.maxContentPerDay
        ? contentToday >= limits.maxContentPerDay
        : false,
      tokensExceeded: limits.maxTokensPerMonth
        ? tokensThisPeriod >= limits.maxTokensPerMonth
        : false,
      usage: {
        imagesThisPeriod,
        contentToday,
        tokensThisPeriod,
      },
    };
  }

  /**
   * Get usage for multiple businesses (admin view)
   */
  static async getAllBusinessUsage(
    limit: number = 100
  ): Promise<
    Array<{
      businessId: string;
      totalTokensUsed: number;
      totalImagesGenerated: number;
      totalContentGenerations: number;
      lastActivity: Date;
    }>
  > {
    const usages = await AIUsageModel.find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select({
        businessId: 1,
        totalTokensUsed: 1,
        totalImagesGenerated: 1,
        totalContentGenerations: 1,
        updatedAt: 1,
      });

    return usages.map((u) => ({
      businessId: u.businessId.toString(),
      totalTokensUsed: u.totalTokensUsed,
      totalImagesGenerated: u.totalImagesGenerated,
      totalContentGenerations: u.totalContentGenerations,
      lastActivity: u.updatedAt,
    }));
  }
}
