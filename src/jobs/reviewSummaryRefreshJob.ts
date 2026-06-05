// ─────────────────────────────────────────────────────────────────────────────
//  reviewSummaryRefreshJob.ts
//
//  Nightly job that pre-warms review summaries for all active businesses.
//
//  Why this exists:
//    reviewChat.service.ts generates a per-business review summary lazily —
//    the first user to chat after the 24h TTL pays a ~3-5s latency hit while
//    we summarize. This job does that work overnight so the cached summary is
//    already warm when consumers arrive in the morning.
//
//  Behavior:
//    • Loops every active business in the backend DB.
//    • Calls reviewChatService.generateSummary() for each.
//    • Businesses with no reviews return null → counted as "skipped", not failed.
//    • Each business is wrapped in its own try/catch: one failure never stops
//      the rest of the run.
//    • A small delay between businesses keeps us under the OpenAI rate limit
//      during the burst (same reasoning as the jitter in
//      agentTemplateGenerationJob — see MAINTAINER_NOTES).
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { getBackendConnection } from "../db/connection.js";
import { getBackendBusinessModel } from "../models/pinntagBackend/business.model.js";
import { reviewChatService } from "../api/services/reviewChat.service.js";

// Pause between businesses (ms). Spreads OpenAI calls out so a large run
// doesn't trip rate limits. Tune if the run is too slow or hits limits.
const INTER_BUSINESS_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ReviewSummaryRefreshJob {
  /**
   * Refresh review summaries for every active business.
   */
  static async execute(): Promise<void> {
    const startedAt = Date.now();
    logger.info("Starting review summary refresh job");

    const conn = await getBackendConnection();
    const BusinessModel = getBackendBusinessModel(conn);

    // "Active" = not deleted and flagged active. Pull only the _id; we don't
    // need the rest of the (large) business document here.
    const businesses = await BusinessModel.find({
      isActive: true,
      isDeleted: { $ne: true },
    })
      .select("_id")
      .lean();

    if (businesses.length === 0) {
      logger.info("No active businesses found — nothing to summarize");
      return;
    }

    logger.info(
      { businessCount: businesses.length },
      "Refreshing review summaries for active businesses",
    );

    let processed = 0;
    let summarized = 0;
    let skipped = 0; // no reviews to summarize
    let failed = 0;

    for (const business of businesses) {
      processed++;
      // `_id` from a .lean() query is already an ObjectId; normalize to a
      // fresh ObjectId from its string form to satisfy the typed signature.
      const businessId = new mongoose.Types.ObjectId(String(business._id));

      try {
        const summary = await reviewChatService.generateSummary(businessId);

        if (summary) {
          summarized++;
          logger.info(
            {
              businessId: String(business._id),
              totalReviews: summary.totalReviews,
            },
            "Review summary refreshed",
          );
        } else {
          // No reviews for this business — expected, not an error.
          skipped++;
        }
      } catch (err: any) {
        failed++;
        // Per-business failure is isolated: log it and keep going.
        logger.error(
          { businessId: String(business._id), error: err.message },
          "Failed to refresh review summary for business",
        );
      }

      if (INTER_BUSINESS_DELAY_MS > 0) {
        await sleep(INTER_BUSINESS_DELAY_MS);
      }
    }

    const durationMs = Date.now() - startedAt;
    logger.info(
      { processed, summarized, skipped, failed, durationMs },
      "Review summary refresh job completed",
    );
  }

  /**
   * Refresh the summary for a single business. Handy for manual triggers /
   * ops after a fresh review ingest.
   */
  static async executeForBusiness(businessId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      throw new Error("Invalid businessId");
    }

    logger.info({ businessId }, "Refreshing review summary for single business");

    const summary = await reviewChatService.generateSummary(
      new mongoose.Types.ObjectId(businessId),
    );

    if (!summary) {
      logger.info(
        { businessId },
        "No reviews available to summarize for business",
      );
      return;
    }

    logger.info(
      { businessId, totalReviews: summary.totalReviews },
      "Review summary refreshed",
    );
  }
}
