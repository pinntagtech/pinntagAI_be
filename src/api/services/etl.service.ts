import axios, { AxiosInstance } from "axios";
import { EventEmitter } from "events";
import WebSocket from "ws";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import {
  JobStatus,
  EtlEvent,
  JobRunRequest,
  StreamingJobUpdate,
} from "../../utils/types/types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class EtlService extends EventEmitter {
  private client: AxiosInstance;
  private wsConnections: Map<string, WebSocket> = new Map();
  private jobPollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private retries: number;
  private readonly maxConcurrentJobs: number = 10;
  private activeJobs: Set<string> = new Set();

  constructor() {
    super();
    this.client = axios.create({
      baseURL: env.ETL_BASE_URL,
      timeout: env.HTTP_TIMEOUT_MS,
      headers: {
        "x-api-key": env.ETL_API_KEY,
        "Content-Type": "application/json",
      },
    });
    this.retries = env.HTTP_RETRIES;

    // Setup axios interceptors for enhanced logging and monitoring
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        logger.info(
          {
            method: config.method?.toUpperCase(),
            url: config.url,
            params: config.params,
          },
          "ETL API Request"
        );
        return config;
      },
      (error) => {
        logger.error(error, "ETL API Request Error");
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info(
          {
            status: response.status,
            url: response.config.url,
            responseTime: response.headers["x-response-time"],
          },
          "ETL API Response"
        );
        return response;
      },
      (error) => {
        logger.error(
          {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
          },
          "ETL API Response Error"
        );
        return Promise.reject(error);
      }
    );
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    context: string = "ETL operation"
  ): Promise<T> {
    let attempt = 0;

    while (true) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        const status = err?.response?.status;
        const retriable = this.isRetriableError(status);

        if (!retriable || attempt > this.retries) {
          logger.error(
            {
              context,
              attempt,
              status,
              error: err.message,
            },
            "ETL operation failed after retries"
          );
          throw err;
        }

        const delay = Math.min(200 * Math.pow(2, attempt - 1), 4000);
        logger.warn(
          {
            context,
            attempt,
            status,
            delay,
          },
          `${context} failed, retrying in ${delay}ms`
        );

        await sleep(delay);
      }
    }
  }

  private isRetriableError(status?: number): boolean {
    return (
      !status ||
      (status >= 500 && status < 600) ||
      status === 429 ||
      status === 408
    );
  }

  // Enhanced health check with detailed metrics
  async health(): Promise<{ status: string; metrics?: any }> {
    return this.withRetry(async () => {
      const { data } = await this.client.get("/health");
      return data;
    }, "Health check");
  }

  // Run ETL job with enhanced parameters and monitoring
  async runJob(
    request: JobRunRequest
  ): Promise<{ jobId: string; status: JobStatus }> {
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      throw new Error(
        `Maximum concurrent jobs (${this.maxConcurrentJobs}) reached`
      );
    }

    return this.withRetry(async () => {
      const { data } = await this.client.post(`/jobs/${request.groupId}/run`, {
        parameters: request.parameters || {},
        priority: request.priority || "normal",
      });

      const jobId = data.jobId;
      this.activeJobs.add(jobId);

      // Start monitoring this job
      this.startJobMonitoring(jobId);

      return data;
    }, `Run job for group ${request.groupId}`);
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.withRetry(async () => {
      const { data } = await this.client.get(`/jobs/${jobId}/status`);
      return data;
    }, `Get status for job ${jobId}`);
  }

  // Get job logs
  async getJobLogs(jobId: string, lines: number = 100): Promise<string[]> {
    return this.withRetry(async () => {
      const { data } = await this.client.get(`/jobs/${jobId}/logs`, {
        params: { lines },
      });
      return data.logs || [];
    }, `Get logs for job ${jobId}`);
  }

  // Cancel job
  async cancelJob(jobId: string): Promise<void> {
    return this.withRetry(async () => {
      await this.client.post(`/jobs/${jobId}/cancel`);
      this.stopJobMonitoring(jobId);
      this.activeJobs.delete(jobId);
    }, `Cancel job ${jobId}`);
  }

  // List events with pagination and filtering
  async listEvents(params?: {
    page?: number;
    limit?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ events: EtlEvent[]; total: number; hasMore: boolean }> {
    return this.withRetry(async () => {
      const { data } = await this.client.get("/events", { params });
      return data;
    }, "List events");
  }

  // Stream job status updates via WebSocket
  streamJobStatus(jobId: string): void {
    const wsUrl = `${env.ETL_BASE_URL}/jobs/${jobId}/stream`;
    const ws = new WebSocket(wsUrl, {
      headers: { "x-api-key": env.ETL_API_KEY },
    });

    ws.on("open", () => {
      logger.info({ jobId }, "WebSocket connection opened for job streaming");
      this.wsConnections.set(jobId, ws);
    });

    ws.on("message", (data: Buffer) => {
      try {
        const update: StreamingJobUpdate = JSON.parse(data.toString());
        this.emit("jobUpdate", update);

        // Emit specific events for different update types
        switch (update.eventType) {
          case "status_change":
            this.emit("statusChange", update);
            break;
          case "progress_update":
            this.emit("progressUpdate", update);
            break;
          case "log_entry":
            this.emit("logEntry", update);
            break;
        }

        // Clean up if job is completed
        if (
          ["completed", "failed", "cancelled"].includes(update.status.status)
        ) {
          this.cleanupJob(jobId);
        }
      } catch (error) {
        logger.error({ jobId, error }, "Error parsing WebSocket message");
      }
    });

    ws.on("error", (error) => {
      logger.error({ jobId, error }, "WebSocket error");
      this.emit("streamError", { jobId, error });
    });

    ws.on("close", () => {
      logger.info({ jobId }, "WebSocket connection closed");
      this.wsConnections.delete(jobId);
    });
  }

  // Fallback polling for job status (when WebSocket is not available)
  private startJobMonitoring(jobId: string): void {
    const interval = setInterval(async () => {
      try {
        const status = await this.getJobStatus(jobId);

        this.emit("jobUpdate", {
          jobId,
          status,
          timestamp: new Date().toISOString(),
          eventType: "status_change",
        });

        // Stop monitoring if job is finished
        if (["completed", "failed", "cancelled"].includes(status.status)) {
          this.stopJobMonitoring(jobId);
          this.activeJobs.delete(jobId);
        }
      } catch (error) {
        logger.error({ jobId, error }, "Error polling job status");
      }
    }, 5000); // Poll every 5 seconds

    this.jobPollingIntervals.set(jobId, interval);
  }

  private stopJobMonitoring(jobId: string): void {
    const interval = this.jobPollingIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.jobPollingIntervals.delete(jobId);
    }

    // Close WebSocket connection if exists
    const ws = this.wsConnections.get(jobId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  }

  private cleanupJob(jobId: string): void {
    this.stopJobMonitoring(jobId);
    this.activeJobs.delete(jobId);
    this.emit("jobCompleted", jobId);
  }

  // Bulk operations
  async runMultipleJobs(
    requests: JobRunRequest[]
  ): Promise<
    Array<
      | { jobId: string; status: JobStatus }
      | { error: any; request: JobRunRequest }
    >
  > {
    const results: Array<
      | { jobId: string; status: JobStatus }
      | { error: any; request: JobRunRequest }
    > = [];

    for (const request of requests) {
      try {
        const result = await this.runJob(request);
        results.push(result);
      } catch (error: Error | any) {
        logger.error({ request, error }, "Failed to run job in bulk operation");
        results.push({ error: error.message, request });
      }
    }

    return results;
  }

  // Get system metrics
  async getMetrics(): Promise<{
    activeJobs: number;
    totalJobs: number;
    systemHealth: any;
  }> {
    return this.withRetry(async () => {
      const { data } = await this.client.get("/metrics");
      return {
        ...data,
        activeJobs: this.activeJobs.size,
        wsConnections: this.wsConnections.size,
      };
    }, "Get metrics");
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    logger.info("Shutting down ETL service...");

    // Close all WebSocket connections
    for (const [jobId, ws] of this.wsConnections) {
      ws.close();
    }
    this.wsConnections.clear();

    // Clear all polling intervals
    for (const [jobId, interval] of this.jobPollingIntervals) {
      clearInterval(interval);
    }
    this.jobPollingIntervals.clear();

    // Clear active jobs
    this.activeJobs.clear();

    logger.info("ETL service shutdown complete");
  }

  // Get active job summaries
  getActiveJobSummary(): Array<{
    jobId: string;
    hasWebSocket: boolean;
    hasPolling: boolean;
  }> {
    return Array.from(this.activeJobs).map((jobId) => ({
      jobId,
      hasWebSocket: this.wsConnections.has(jobId),
      hasPolling: this.jobPollingIntervals.has(jobId),
    }));
  }
}

// Singleton instance
export const etlService = new EtlService();
