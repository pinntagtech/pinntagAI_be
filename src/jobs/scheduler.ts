import cron from "node-cron";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";
import { TemplateUpdateJob } from "./templateUpdateJob.js";
import { DailyTemplateJob } from "./dailyTemplateJob.js";
import { AgentTemplateGenerationJob } from "./agentTemplateGenerationJob.js";
import { SlowTimeTemplateRefreshJob } from "./slowTimeTemplateRefreshJob.js";
import { ReviewSummaryRefreshJob } from "./reviewSummaryRefreshJob.js";

/**
 * Job Scheduler
 * Manages scheduled background jobs using node-cron
 */
export class JobScheduler {
  private static jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize and start all scheduled jobs
   */
  static start(): void {
    logger.info("Initializing job scheduler");

    // Nightly review-summary refresh. Gated by its own flag, and scheduled
    // BEFORE the template-generation early-return below so it runs whether or
    // not template generation is enabled — they're independent concerns.
    if (env.ENABLE_REVIEW_SUMMARY_REFRESH) {
      this.scheduleJob(
        "review-summary-refresh",
        "0 2 * * *", // At 02:00 AM every day
        async () => {
          logger.info("Running review summary refresh job");
          try {
            await ReviewSummaryRefreshJob.execute();
          } catch (error: any) {
            logger.error({ error }, "Review summary refresh job failed");
          }
        }
      );
    } else {
      logger.info(
        "Review summary refresh is DISABLED (ENABLE_REVIEW_SUMMARY_REFRESH=false)."
      );
    }

    if (!env.ENABLE_AI_TEMPLATE_GENERATION) {
      logger.info(
        "AI template generation is DISABLED (ENABLE_AI_TEMPLATE_GENERATION=false). Skipping template cron jobs to save OpenAI quota."
      );
      return;
    }

    logger.info("AI template generation is ENABLED. Scheduling template cron jobs.");

    // Schedule overnight template updates
    // Runs every night at 2:00 AM
    this.scheduleJob(
      "template-update",
      "0 2 * * *", // Cron expression: At 02:00 AM every day
      async () => {
        logger.info("Running scheduled template update job");
        try {
          await TemplateUpdateJob.execute();
        } catch (error: any) {
          logger.error({ error }, "Scheduled template update job failed");
        }
      }
    );

    // Schedule daily themed template generation
    // Runs every day at 6:00 AM to generate day-specific templates
    this.scheduleJob(
      "daily-template",
      "0 6 * * *", // Cron expression: At 06:00 AM every day
      async () => {
        logger.info("Running daily template generation job");
        try {
          await DailyTemplateJob.execute();
        } catch (error: any) {
          logger.error({ error }, "Daily template generation job failed");
        }
      }
    );

    // Schedule overnight agent template generation
    // Runs every night at 3:00 AM to generate templates for all AI agents
    this.scheduleJob(
      "agent-template-generation",
      "0 3 * * *", // Cron expression: At 03:00 AM every day
      async () => {
        logger.info("Running agent template generation job");
        try {
          await AgentTemplateGenerationJob.execute();
        } catch (error: any) {
          logger.error({ error }, "Agent template generation job failed");
        }
      }
    );

    // Schedule hourly slow-time template refresh
    // Runs at the top of every hour for businesses whose owner enabled
    // Business.dailyRecommendationEnabled in the backend. Updates the
    // slow-time deal template (and its artwork) in place based on
    // user_footprint signals.
    this.scheduleJob(
      "slow-time-template-refresh",
      "0 * * * *", // Cron expression: At minute 0 of every hour
      async () => {
        logger.info("Running slow-time template refresh job");
        try {
          await SlowTimeTemplateRefreshJob.execute();
        } catch (error: any) {
          logger.error({ error }, "Slow-time template refresh job failed");
        }
      }
    );

    logger.info(
      { jobCount: this.jobs.size },
      "Job scheduler started successfully"
    );
  }

  /**
   * Stop all scheduled jobs
   */
  static stop(): void {
    logger.info("Stopping job scheduler");

    this.jobs.forEach((task, name) => {
      task.stop();
      logger.info({ jobName: name }, "Stopped scheduled job");
    });

    this.jobs.clear();
    logger.info("Job scheduler stopped");
  }

  /**
   * Schedule a new job
   */
  private static scheduleJob(
    name: string,
    cronExpression: string,
    handler: () => Promise<void>
  ): void {
    if (this.jobs.has(name)) {
      logger.warn({ jobName: name }, "Job already exists, replacing it");
      this.jobs.get(name)?.stop();
    }

    const task = cron.schedule(
      cronExpression,
      async () => {
        const startTime = Date.now();
        logger.info({ jobName: name }, "Starting scheduled job");

        try {
          await handler();
          const duration = Date.now() - startTime;
          logger.info(
            { jobName: name, durationMs: duration },
            "Scheduled job completed successfully"
          );
        } catch (error: any) {
          const duration = Date.now() - startTime;
          logger.error(
            { error, jobName: name, durationMs: duration },
            "Scheduled job failed"
          );
        }
      }
    );

    this.jobs.set(name, task);
    logger.info(
      { jobName: name, cronExpression },
      "Scheduled job registered"
    );
  }

  /**
   * Get status of all scheduled jobs
   */
  static getStatus(): Array<{ name: string; isRunning: boolean }> {
    const status: Array<{ name: string; isRunning: boolean }> = [];

    this.jobs.forEach((task, name) => {
      status.push({
        name,
        isRunning: task !== null,
      });
    });

    return status;
  }

  /**
   * Manually trigger a job by name
   */
  static async triggerJob(
    name: string,
    options?: { dayOfWeek?: number; businessId?: string }
  ): Promise<void> {
    logger.info({ jobName: name, options }, "Manually triggering job");

    switch (name) {
      case "template-update":
        await TemplateUpdateJob.execute();
        break;
      case "daily-template":
        if (options?.dayOfWeek !== undefined) {
          await DailyTemplateJob.executeForDay(options.dayOfWeek);
        } else {
          await DailyTemplateJob.execute();
        }
        break;
      case "agent-template-generation":
        await AgentTemplateGenerationJob.execute();
        break;
      case "slow-time-template-refresh":
        await SlowTimeTemplateRefreshJob.execute();
        break;
      case "review-summary-refresh":
        if (options?.businessId) {
          await ReviewSummaryRefreshJob.executeForBusiness(options.businessId);
        } else {
          await ReviewSummaryRefreshJob.execute();
        }
        break;
      default:
        throw new Error(`Unknown job: ${name}`);
    }
  }
}

/**
 * Cron expression examples:
 * - "0 2 * * *"      = Every day at 2:00 AM
 * - "0 star/6 * * *"    = Every 6 hours
 * - "0 0 * * 0"      = Every Sunday at midnight
 * - "0 0 1 * *"      = First day of every month at midnight
 * - "0 star/12 * * *"   = Every 12 hours
 * (Replace 'star' with * in actual cron expressions)
 */
