import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { BusinessAIAssistantModel } from "../models/businessAIAssistant.model.js";
import { AI_TrainingModel } from "../models/AI_Training.model.js";
import {
  SlowTimeRecommendationService,
  SlowTimeTemplate,
} from "../api/services/slowTimeRecommendation.service.js";
import { ContentAssistService } from "../api/services/contentAssist.service.js";
import { triggerNotification } from "../api/services/pinntagBackend.service.js";
import {
  upsertTemplate,
  TemplateCreatorType,
  TemplateScope,
  DiscountType,
  IDealTemplate,
} from "../models/pinntagBackend/dealTemplate.model.js";

const SLOW_TIME_DISCOUNT_TYPE_MAP: Record<string, DiscountType> = {
  "% Off": DiscountType.Percentage,
  "$ Off": DiscountType.Flat,
  "BOGO": DiscountType.BOGO,
  "Free Item": DiscountType.FREE_ITEM,
  "Happy Hour": DiscountType.HAPPY_HOUR,
};

/**
 * Build a Partial<IDealTemplate> from a SlowTimeTemplate, keyed so the
 * upsert filter can match in-place updates from the cron.
 */
function buildDealTemplateData(
  businessId: string,
  template: SlowTimeTemplate,
): Partial<IDealTemplate> {
  const discountType =
    (template.discountType && SLOW_TIME_DISCOUNT_TYPE_MAP[template.discountType]) ||
    DiscountType.CUSTOM;

  const businessObjectId = new mongoose.Types.ObjectId(businessId);

  return {
    creatorType: TemplateCreatorType.SYSTEM,
    type: template.type,
    scope: TemplateScope.BUSINESS_SPECIFIC,
    businessId: businessObjectId as any,
    discountValue: template.suggestedDiscountValue ?? "",
    discountType,
    contentType: template.contentType,
    percentOffValue:
      template.discountType === "% Off" && template.suggestedDiscountValue
        ? Number(template.suggestedDiscountValue)
        : undefined,
    dollarOffValue:
      template.discountType === "$ Off" && template.suggestedDiscountValue
        ? Number(template.suggestedDiscountValue)
        : undefined,
    bogoOrFreeItem:
      template.discountType === "BOGO" || template.discountType === "Free Item"
        ? template.description
        : undefined,
    categories: [],
    title: template.title,
    keywords: [],
    description: template.description,
    targetGenders: ["male", "female", "others"],
    promotionCode: undefined,
    isFree: false,
    termsApplied: !!template.termsAndConditions,
    termsAndConditions: template.termsAndConditions,
    businessCategories: [],
    tags: [template.occasion, template.intensity],
    generatedByAI: true,
    aiGenerationData: {
      occasion: "slow_period",
      bestTiming: template.bestTiming,
      callToAction: template.callToAction,
      marketingTips: [template.rationale],
    },
    isActive: true,
  };
}

/**
 * Slow-Time Template Refresh Job
 *
 * Hourly job. For each business that has opted in
 * (BusinessAIAssistant.enableAutoSlowTimeTemplates === true), checks if the
 * business is currently in a slow window — using the user_footprints data
 * and the training-side `slow_periods` answer — and if so, refreshes the
 * business's slow-time deal template in place.
 *
 * Notification copy is generated and persisted on the deal template doc
 * (under aiGenerationData.notificationVariants) for the backend to pick
 * up and deliver. The AI service does not push notifications itself.
 */
export class SlowTimeTemplateRefreshJob {
  static async execute(): Promise<void> {
    const startedAt = Date.now();
    logger.info("Starting slow-time template refresh job");

    const agents = await BusinessAIAssistantModel.find({
      enableAutoSlowTimeTemplates: true,
    })
      .select(
        "businessId businessName lastSlowTimeNotifiedAt lastSlowTimeNotifiedOccasion",
      )
      .lean();

    if (agents.length === 0) {
      logger.info("No businesses opted into auto slow-time templates");
      return;
    }

    let processed = 0;
    let refreshed = 0;
    let skipped = 0;
    let failed = 0;

    for (const agent of agents) {
      const businessId = String(agent.businessId);
      processed++;
      try {
        // Only act on businesses with completed training. Avoids posting
        // generic copy for businesses that haven't told us anything yet.
        const training = await AI_TrainingModel.findOne({
          businessId: new mongoose.Types.ObjectId(businessId),
        })
          .select("trainingStatus")
          .lean();

        if (training?.trainingStatus !== "completed") {
          skipped++;
          continue;
        }

        const recs = await SlowTimeRecommendationService.getRecommendations(
          businessId,
        );

        const template = recs.primaryTemplate;
        if (!template) {
          // With training complete, the service always returns a primary
          // template, so this branch is defensive.
          skipped++;
          continue;
        }

        // Only refresh when there is a real signal OR the evergreen
        // fallback has fired — otherwise we'd update the doc on every
        // run for no reason.
        const isEvergreen = template.occasion === "evergreen_slow_period";
        const hasRealSignal = recs.footprint.signals.some(
          (s) => s !== "evergreen_slow_period",
        );
        if (!isEvergreen && !hasRealSignal) {
          skipped++;
          continue;
        }

        const dealData = buildDealTemplateData(businessId, template);

        // Generate notification copy (best-effort) and stash on the doc
        // for the backend to deliver. Stays AI-side copy-only.
        let notificationVariants:
          | Awaited<
              ReturnType<typeof ContentAssistService.generateNotificationCopy>
            >["variants"]
          | undefined;
        try {
          const notif = await ContentAssistService.generateNotificationCopy({
            appType: "BUSINESS",
            triggerType: "business_inactivity",
            tone: "coach",
            variantCount: 3,
            emojiAllowed: true,
            context: {
              businessId,
              businessName: agent.businessName,
              offerName: template.title,
              category: template.contentType,
            },
          });
          notificationVariants = notif.variants;
        } catch (notifErr: any) {
          logger.warn(
            { businessId, err: notifErr?.message },
            "Failed to generate notification copy in slow-time job",
          );
        }

        if (notificationVariants && dealData.aiGenerationData) {
          (dealData.aiGenerationData as any).notificationVariants =
            notificationVariants;
        }

        // In-place update keyed by (businessId, type, occasion=slow_period)
        // so each opted-in business gets a single auto-managed slow-time
        // template doc that updates instead of accumulating duplicates.
        await upsertTemplate(
          {
            businessId: new mongoose.Types.ObjectId(businessId) as any,
            type: template.type,
            "aiGenerationData.occasion": "slow_period",
          } as any,
          dealData,
        );

        // Cooldown: don't re-notify a business more than once per 6 hours
        // unless the picked occasion changed (e.g., evergreen → low_views)
        // since the last delivery.
        const COOLDOWN_MS = 6 * 60 * 60 * 1000;
        const lastNotifiedAt = (agent as any).lastSlowTimeNotifiedAt as
          | Date
          | undefined;
        const lastOccasion = (agent as any).lastSlowTimeNotifiedOccasion as
          | string
          | undefined;
        const occasionChanged =
          lastOccasion && lastOccasion !== template.occasion;
        const cooldownExpired =
          !lastNotifiedAt ||
          Date.now() - new Date(lastNotifiedAt).getTime() >= COOLDOWN_MS;
        const shouldNotify =
          !!notificationVariants?.length && (cooldownExpired || occasionChanged);

        let notificationDelivered = false;
        if (shouldNotify) {
          const v = notificationVariants![0];
          const delivery = await triggerNotification({
            businessId,
            title: v.title,
            message: v.body,
          });
          notificationDelivered = delivery.delivered;
        }

        const assistantUpdate: Record<string, any> = {
          lastSlowTimeTemplateRefreshAt: new Date(),
        };
        if (notificationDelivered) {
          assistantUpdate.lastSlowTimeNotifiedAt = new Date();
          assistantUpdate.lastSlowTimeNotifiedOccasion = template.occasion;
        }
        await BusinessAIAssistantModel.updateOne(
          { businessId: new mongoose.Types.ObjectId(businessId) },
          { $set: assistantUpdate },
        );

        refreshed++;
        logger.info(
          {
            businessId,
            occasion: template.occasion,
            intensity: template.intensity,
            signals: recs.footprint.signals,
            notificationVariants: notificationVariants?.length ?? 0,
            notificationDelivered,
            cooldownExpired,
            occasionChanged: !!occasionChanged,
          },
          "Refreshed slow-time template",
        );
      } catch (err: any) {
        failed++;
        logger.error(
          { businessId, err: err?.message, stack: err?.stack },
          "Slow-time template refresh failed for business",
        );
      }
    }

    logger.info(
      {
        processed,
        refreshed,
        skipped,
        failed,
        durationMs: Date.now() - startedAt,
      },
      "Slow-time template refresh job completed",
    );
  }

  /**
   * Trigger the job for a single business — useful for the manual API
   * and for QA without waiting for the hourly tick.
   */
  static async executeForBusiness(businessId: string): Promise<void> {
    const agent = await BusinessAIAssistantModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    })
      .select("businessId businessName enableAutoSlowTimeTemplates")
      .lean();

    if (!agent) {
      throw new Error(`No AI agent found for business ID: ${businessId}`);
    }
    if (!agent.enableAutoSlowTimeTemplates) {
      throw new Error(
        `Business ${businessId} has not opted into auto slow-time templates`,
      );
    }

    // Reuse the same path as the cron tick.
    await this.execute();
  }
}
