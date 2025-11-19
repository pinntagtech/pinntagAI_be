import cron from "node-cron";
import { logger } from "../utils/logger.js";
import { TemplateUpdateJob } from "./templateUpdateJob.js";

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
  static async triggerJob(name: string): Promise<void> {
    logger.info({ jobName: name }, "Manually triggering job");

    switch (name) {
      case "template-update":
        await TemplateUpdateJob.execute();
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
