import { SubscriptionAccess } from "./types/aiAssist.types.js";
import { logger } from "./logger.js";

// ===========================
// Subscription Tiers
// ===========================

/**
 * Subscription tier levels
 */
export enum SubscriptionTier {
  FREE = "free",
  BASIC = "basic",
  PROFESSIONAL = "professional",
  ENTERPRISE = "enterprise",
}

/**
 * Feature flags for each subscription tier
 */
export interface TierFeatures {
  aiContentAssist: boolean;
  aiImageGeneration: boolean;
  maxImagesPerMonth: number;
  maxContentGenerationsPerDay: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
}

/**
 * Tier configuration - easily modifiable for future subscription changes
 */
const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  [SubscriptionTier.FREE]: {
    aiContentAssist: true, // Free users can use content assist
    aiImageGeneration: false,
    maxImagesPerMonth: 0,
    maxContentGenerationsPerDay: 5,
    advancedAnalytics: false,
    prioritySupport: false,
  },
  [SubscriptionTier.BASIC]: {
    aiContentAssist: true,
    aiImageGeneration: true,
    maxImagesPerMonth: 10,
    maxContentGenerationsPerDay: 20,
    advancedAnalytics: false,
    prioritySupport: false,
  },
  [SubscriptionTier.PROFESSIONAL]: {
    aiContentAssist: true,
    aiImageGeneration: true,
    maxImagesPerMonth: 50,
    maxContentGenerationsPerDay: 100,
    advancedAnalytics: true,
    prioritySupport: false,
  },
  [SubscriptionTier.ENTERPRISE]: {
    aiContentAssist: true,
    aiImageGeneration: true,
    maxImagesPerMonth: -1, // Unlimited
    maxContentGenerationsPerDay: -1, // Unlimited
    advancedAnalytics: true,
    prioritySupport: true,
  },
};

// ===========================
// Subscription Check Functions
// ===========================

/**
 * Get the subscription tier for a business
 * This is a placeholder that should be replaced with actual subscription lookup
 *
 * @param businessId - The business ID to check
 * @returns The subscription tier for the business
 */
export async function getBusinessSubscriptionTier(
  businessId: string
): Promise<SubscriptionTier> {
  try {
    // TODO: Replace with actual subscription lookup from database or subscription service
    // Example: const subscription = await SubscriptionModel.findOne({ businessId });
    // return subscription?.tier || SubscriptionTier.FREE;

    // For now, return PROFESSIONAL to allow testing
    // In production, this should query the actual subscription status
    logger.debug({ businessId }, "Checking subscription tier for business");

    // Placeholder: Return PROFESSIONAL tier for all businesses during development
    // Change this to SubscriptionTier.FREE to test subscription gating
    return SubscriptionTier.PROFESSIONAL;
  } catch (error: any) {
    logger.error({ businessId, error }, "Error getting subscription tier");
    // Default to FREE tier on error for safety
    return SubscriptionTier.FREE;
  }
}

/**
 * Get features for a subscription tier
 *
 * @param tier - The subscription tier
 * @returns The features available for that tier
 */
export function getTierFeatures(tier: SubscriptionTier): TierFeatures {
  return TIER_FEATURES[tier];
}

/**
 * Check if a business has access to AI image generation
 *
 * @param businessId - The business ID to check
 * @returns Access status with details
 */
export async function checkImageGenerationAccess(
  businessId: string
): Promise<SubscriptionAccess> {
  try {
    const tier = await getBusinessSubscriptionTier(businessId);
    const features = getTierFeatures(tier);

    if (!features.aiImageGeneration) {
      return {
        hasAccess: false,
        reason: "AI image generation requires a paid subscription",
        currentPlan: tier,
        requiredPlan: SubscriptionTier.BASIC,
        upgradeUrl: `/upgrade?feature=ai-image-generation`,
      };
    }

    // TODO: Check usage limits (images generated this month)
    // const usageCount = await getMonthlyImageUsage(businessId);
    // if (features.maxImagesPerMonth !== -1 && usageCount >= features.maxImagesPerMonth) {
    //   return {
    //     hasAccess: false,
    //     reason: `Monthly image generation limit reached (${features.maxImagesPerMonth})`,
    //     currentPlan: tier,
    //     upgradeUrl: `/upgrade?feature=more-images`,
    //   };
    // }

    return {
      hasAccess: true,
      currentPlan: tier,
    };
  } catch (error: any) {
    logger.error({ businessId, error }, "Error checking image generation access");
    return {
      hasAccess: false,
      reason: "Unable to verify subscription status",
    };
  }
}

/**
 * Check if a business has access to AI content assist
 *
 * @param businessId - The business ID to check
 * @returns Access status with details
 */
export async function checkContentAssistAccess(
  businessId: string
): Promise<SubscriptionAccess> {
  try {
    const tier = await getBusinessSubscriptionTier(businessId);
    const features = getTierFeatures(tier);

    if (!features.aiContentAssist) {
      return {
        hasAccess: false,
        reason: "AI content assist is not available for your subscription",
        currentPlan: tier,
        requiredPlan: SubscriptionTier.FREE, // Should always be available
      };
    }

    // TODO: Check daily usage limits
    // const usageCount = await getDailyContentGenerationUsage(businessId);
    // if (features.maxContentGenerationsPerDay !== -1 && usageCount >= features.maxContentGenerationsPerDay) {
    //   return {
    //     hasAccess: false,
    //     reason: `Daily content generation limit reached (${features.maxContentGenerationsPerDay})`,
    //     currentPlan: tier,
    //     upgradeUrl: `/upgrade?feature=more-content`,
    //   };
    // }

    return {
      hasAccess: true,
      currentPlan: tier,
    };
  } catch (error: any) {
    logger.error({ businessId, error }, "Error checking content assist access");
    return {
      hasAccess: false,
      reason: "Unable to verify subscription status",
    };
  }
}

/**
 * Get remaining usage for a feature
 *
 * @param businessId - The business ID
 * @param feature - The feature to check
 * @returns Remaining usage count (-1 for unlimited)
 */
export async function getRemainingUsage(
  businessId: string,
  feature: "images" | "content"
): Promise<number> {
  try {
    const tier = await getBusinessSubscriptionTier(businessId);
    const features = getTierFeatures(tier);

    if (feature === "images") {
      if (features.maxImagesPerMonth === -1) return -1;
      // TODO: Get actual usage from database
      // const used = await getMonthlyImageUsage(businessId);
      // return Math.max(0, features.maxImagesPerMonth - used);
      return features.maxImagesPerMonth;
    } else {
      if (features.maxContentGenerationsPerDay === -1) return -1;
      // TODO: Get actual usage from database
      // const used = await getDailyContentGenerationUsage(businessId);
      // return Math.max(0, features.maxContentGenerationsPerDay - used);
      return features.maxContentGenerationsPerDay;
    }
  } catch (error: any) {
    logger.error({ businessId, feature, error }, "Error getting remaining usage");
    return 0;
  }
}

/**
 * Record usage of a feature
 *
 * @param businessId - The business ID
 * @param feature - The feature used
 * @param count - Number of uses to record
 */
export async function recordFeatureUsage(
  businessId: string,
  feature: "images" | "content",
  count: number = 1
): Promise<void> {
  try {
    // TODO: Implement usage tracking in database
    // await UsageModel.updateOne(
    //   { businessId, feature, period: getCurrentPeriod(feature) },
    //   { $inc: { count } },
    //   { upsert: true }
    // );
    logger.debug({ businessId, feature, count }, "Recorded feature usage");
  } catch (error: any) {
    logger.error({ businessId, feature, error }, "Error recording feature usage");
  }
}
