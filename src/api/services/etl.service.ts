import axios, { AxiosInstance } from "axios";
import { EventEmitter } from "events";
import WebSocket from "ws";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { JobModel } from "../../models/job.model";
import { ScrapedEventModel } from "../../models/scraped-event.model";
import {
  EtlEvent,
  JobStatus,
  JobRunRequest,
  StreamingJobUpdate,
} from "../../utils/types/types";
import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { count } from "console";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const api_key = env.ETL_API_KEY;
const auth_header = env.ETL_API_KEY_HEADER_NAME || "X-API-Key";

export class EtlService extends EventEmitter {
  async getJobLocal(jobId: string) {
    const job = await JobModel.findOne({ jobId });
    if (!job) throw new Error("Job not found");
    return job;
  }

  async listJobsLocal(
    params: {
      status?: string;
      groupId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { status, groupId, limit = 50, offset = 0 } = params;
    const query: any = {};
    if (status) query.status = status;
    if (groupId) query.groupId = groupId;
    const [items, total] = await Promise.all([
      JobModel.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit),
      JobModel.countDocuments(query),
    ]);
    return { items, total, hasMore: offset + items.length < total };
  }

  async addEventsToJob(jobId: string, events: any[]) {
    const job = await JobModel.findOne({ jobId });
    if (!job) throw new Error("Job not found");
    if (!Array.isArray(events)) throw new Error("events must be an array");
    const docs = events.map((e) => ({ ...e, jobId }));
    await ScrapedEventModel.insertMany(docs, { ordered: false });
    return { inserted: docs.length };
  }

  async listAllEventsIdToJob(jobId: string) {
    logger.info({ jobId }, "Listing all events for job");
    const job = await JobModel.findOne({ jobId });
    if (!job) throw new Error("Job not found");
    const events = await ScrapedEventModel.find({ jobId }, { _id: 1 }).sort({
      scrapedAt: -1,
    });
    logger.info({ count: events.length }, "Events fetched");
    return { jobId, events, total: events.length };
  }

  async getEventById(eventId: string) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid event ID");
    }
    const event = await ScrapedEventModel.findById(eventId);
    if (!event) throw new Error("Event not found");
    return event;
  }

  async listJobEvents(jobId: string, page: number = 1, limit: number = 100) {
    logger.info({ jobId }, "Listing all events for job");
    const job = await JobModel.findOne({ jobId });
    if (!job) throw new Error("Job not found");
    logger.info(job, "Job found");
    const total = await ScrapedEventModel.countDocuments({ jobId });
    const events = await ScrapedEventModel.find({ jobId })
      .sort({ scrapedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    logger.info({ count: events.length }, "Events fetched");
    return { jobId, events, total, count: events.length };
  }

  async listJobEventsFiltered(
    jobId: string,
    filter: { verified?: boolean; exported?: boolean }
  ) {
    const job = await JobModel.findOne({ jobId });
    if (!job) throw new Error("Job not found");
    const query: any = { jobId };
    if (typeof filter.verified === "boolean") query.verified = filter.verified;
    if (typeof filter.exported === "boolean") query.exported = filter.exported;
    const events = await ScrapedEventModel.find(query).sort({ scrapedAt: -1 });
    return { jobId, events, total: events.length };
  }

  async deleteEventsForJob(jobId: string) {
    const job = await JobModel.findOne({ jobId });
    if (!job) throw new Error("Job not found");
    const result = await ScrapedEventModel.deleteMany({ jobId });
    return { deletedCount: result.deletedCount || 0 };
  }

  async updateEvent(eventId: string, patch: Partial<any>) {
    const update: any = { ...patch, editedAt: new Date() };
    const updated = await ScrapedEventModel.findByIdAndUpdate(eventId, update, {
      new: true,
    });
    if (!updated) throw new Error("Event not found");
    return updated;
  }

  async verifyEvent(eventId: string, verified: boolean, verifiedBy?: string) {
    const update: any = {
      verified,
      verifiedBy: verified ? verifiedBy : undefined,
      verifiedAt: verified ? new Date() : undefined,
    };
    const updated = await ScrapedEventModel.findByIdAndUpdate(eventId, update, {
      new: true,
    });
    if (!updated) throw new Error("Event not found");
    return updated;
  }

  async exportVerifiedEvents(
    jobId: string,
    options: { markExported?: boolean } = {}
  ) {
    const job = await JobModel.findOne({ jobId });
    if (!job) throw new Error("Job not found");
    const query = { jobId, verified: true, exported: false } as any;
    const events = await ScrapedEventModel.find(query)
      .sort({ scrapedAt: -1 })
      .lean();
    if (options.markExported && events.length) {
      await ScrapedEventModel.updateMany(query, {
        $set: { exported: true, exportedAt: new Date() },
      });
    }
    return { jobId, exportedCount: events.length, events };
  }

  // Create Job
  async createJob(payload: {
    urls?: string[];
    source?: string;
    output_formats?: string[];
    metadata?: Record<string, any>;
    groupId?: string;
  }): Promise<{ jobId: string; status: "created" } & { job: any }> {
    // Basic validation
    if (
      !payload.urls ||
      !Array.isArray(payload.urls) ||
      payload.urls.length === 0
    ) {
      throw new Error("Invalid payload: urls must be a non-empty array");
    }
    if (!payload.source || typeof payload.source !== "string") {
      throw new Error("Invalid payload: source must be a string");
    }
    if (
      !payload.output_formats ||
      !Array.isArray(payload.output_formats) ||
      payload.output_formats.length === 0
    ) {
      throw new Error(
        "Invalid payload: output_formats must be a non-empty array"
      );
    }
    // Save Job in local DB first
    const job = await JobModel.create({
      jobId: randomUUID(),
      groupId: payload.groupId,
      urls: payload.urls || [],
      source: payload.source,
      output_formats: payload.output_formats || [],
      status: "created",
      metadata: payload.metadata || {},
    });
    const jobId = job.jobId;

    const result = await this.withRetry(async () => {
      const body = {
        jobId,
        id: jobId,
        source: payload.source,
        urls: payload.urls,
        output_formats: payload.output_formats || [],
        metadata: payload.metadata || {},
        priority: "normal",
        tenant_id: "tenant_1",
      };

      const { data } = await this.client.post("/jobs", body, {
        headers: { [auth_header]: api_key },
      });

      const backendJobId = data?.jobId || data?.id;
      if (backendJobId && backendJobId !== jobId) {
        logger.warn(
          { savedJobId: jobId, backendJobId },
          "Backend C returned mismatched jobId; using persisted jobId"
        );
      }

      return {
        ...(data || {}),
        jobId,
      };
    }, "Create job");

    return {
      ...result,
      job,
      status: result?.status || "created",
      jobId,
    } as any;
  }

  // === Local (DB-backed) job + event helpers ===
  async createJobLocal(payload: {
    urls?: string[];
    source?: string;
    output_formats?: string[];
    metadata?: Record<string, any>;
    groupId?: string;
  }): Promise<{ jobId: string; status: "created" } & { job: any }> {
    const jobId = randomUUID();
    const job = await JobModel.create({
      jobId,
      groupId: payload.groupId,
      urls: payload.urls || [],
      source: payload.source,
      output_formats: payload.output_formats || [],
      status: "created",
      metadata: payload.metadata || {},
    });
    return { jobId, status: "created", job } as any;
  }

  // Get Job
  async getJob(jobId: string): Promise<any> {
    return this.withRetry(async () => {
      const { data } = await this.client.get(`/jobs/${jobId}`, {
        headers: { [auth_header]: api_key },
      });
      return data;
    }, `Get job ${jobId}`);
  }

  // List Jobs
  async listJobs(params: {
    limit?: number;
    offset?: number;
    status?: string;
    source?: string;
  }): Promise<any> {
    const { ...query } = params;
    return this.withRetry(async () => {
      const { data } = await this.client.get("/jobs", {
        params: query,
        headers: { [auth_header]: api_key },
      });
      return data;
    }, "List jobs");
  }

  // Pause Job
  async pauseJob(jobId: string): Promise<void> {
    return this.withRetry(async () => {
      await this.client.patch(
        `/jobs/${jobId}/pause`,
        {},
        {
          headers: { [auth_header]: api_key },
        }
      );
    }, `Pause job ${jobId}`);
  }

  // Resume Job
  async resumeJob(jobId: string): Promise<void> {
    return this.withRetry(async () => {
      await this.client.patch(
        `/jobs/${jobId}/resume`,
        {},
        {
          headers: { [auth_header]: api_key },
        }
      );
    }, `Resume job ${jobId}`);
  }

  // Cancel Job
  async cancelJob(jobId: string): Promise<void> {
    return this.withRetry(async () => {
      await this.client.patch(
        `/jobs/${jobId}/cancel`,
        {},
        {
          headers: { [auth_header]: api_key },
        }
      );
      this.stopJobMonitoring(jobId);
      this.activeJobs.delete(jobId);
    }, `Cancel job ${jobId}`);
  }

  // Delete Job
  async deleteJob(jobId: string): Promise<void> {
    return this.withRetry(async () => {
      await this.client.delete(`/jobs/${jobId}`, {
        headers: { [auth_header]: api_key },
      });
      this.activeJobs.delete(jobId);
    }, `Delete job ${jobId}`);
  }

  // Stream Job Progress (returns WebSocket instance)
  streamJobProgress(jobId: string): WebSocket {
    const wsUrl = `${env.ETL_BASE_URL}/jobs/${jobId}/stream`;
    const ws = new WebSocket(wsUrl, {
      headers: { [auth_header]: api_key },
    });
    this.wsConnections.set(jobId, ws);
    return ws;
  }

  // Get Job Statistics
  async getJobStatistics(): Promise<any> {
    return this.withRetry(async () => {
      const { data } = await this.client.get("/jobs/statistics", {
        headers: { [auth_header]: api_key },
      });
      return data;
    }, "Get job statistics");
  }
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
        [auth_header]: env.ETL_API_KEY,
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

  /**
   * Register a job in the shared DB and instruct Backend C to start it by jobId.
   * This supports the flow where Backend A triggers ETL for a URL/Source group.
   */
  async registerAndStartGroupJob(
    request: JobRunRequest & { metadata?: Record<string, any> }
  ) {
    // 1) Create local job record (shared DB)
    const created = await this.createJobLocal({
      groupId: request.groupId,
      metadata: request.metadata,
    });

    try {
      // 2) Ask Backend C to start this exact jobId
      await this.startJobById(
        created.jobId,
        request.groupId,
        request.parameters,
        request.priority
      );

      // 3) Update local job to running
      await JobModel.updateOne(
        { jobId: created.jobId },
        { $set: { status: "running" } }
      );
      // Begin monitoring
      this.activeJobs.add(created.jobId);
      this.startJobMonitoring(created.jobId);
      return {
        jobId: created.jobId,
        status: {
          id: created.jobId,
          groupId: request.groupId,
          status: "running",
          progress: 0,
        },
      };
    } catch (err: any) {
      // Best effort update to failed
      await JobModel.updateOne(
        { jobId: created.jobId },
        { $set: { status: "failed", error: err?.message || "failed to start" } }
      );
      throw err;
    }
  }

  // Backend C endpoint to start job by id (shared DB lookup)
  private async startJobById(
    jobId: string,
    groupId: string,
    parameters?: Record<string, any>,
    priority?: "low" | "normal" | "high"
  ): Promise<void> {
    return this.withRetry(async () => {
      await this.client.post(
        `/jobs/${jobId}/start`,
        {
          groupId,
          parameters: parameters || {},
          priority: priority || "normal",
        },
        { headers: { [auth_header]: api_key } }
      );
    }, `Start job by id ${jobId}`);
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

  // List events with pagination and filtering
  async listEvents(params?: {
    page?: number;
    limit?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    verified?: string | boolean;
    exported?: string | boolean;
    jobId?: string;
  }): Promise<{ events: any[]; total: number; hasMore: boolean }> {
    const page = Number(params?.page ?? 1);
    const limit = Math.min(Number(params?.limit ?? 50), 200);
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params?.type) query.type = params.type;
    if (params?.jobId) query.jobId = params.jobId;
    if (params?.verified !== undefined) {
      const v =
        typeof params.verified === "string"
          ? params.verified === "true"
          : !!params.verified;
      query.verified = v;
    }
    if (params?.exported !== undefined) {
      const e =
        typeof params.exported === "string"
          ? params.exported === "true"
          : !!params.exported;
      query.exported = e;
    }
    if (params?.dateFrom || params?.dateTo) {
      query.scrapedAt = {} as any;
      if (params.dateFrom) query.scrapedAt.$gte = new Date(params.dateFrom);
      if (params.dateTo) query.scrapedAt.$lte = new Date(params.dateTo);
    }

    const [events, total] = await Promise.all([
      ScrapedEventModel.find(query)
        .sort({ scrapedAt: -1 })
        .skip(skip)
        .limit(limit),
      ScrapedEventModel.countDocuments(query),
    ]);

    return {
      events,
      total,
      hasMore: skip + events.length < total,
    };
  }

  // Stream job status updates via WebSocket
  streamJobStatus(jobId: string): void {
    const wsUrl = `${env.ETL_BASE_URL}/jobs/${jobId}/stream`;
    const ws = new WebSocket(wsUrl, {
      headers: { [auth_header]: env.ETL_API_KEY },
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
          // Persist final status
          await JobModel.updateOne(
            { jobId },
            { $set: { status: status.status, error: status.error } }
          );
          this.stopJobMonitoring(jobId);
          this.activeJobs.delete(jobId);
        } else {
          // Persist running status
          await JobModel.updateOne(
            { jobId },
            { $set: { status: status.status } }
          );
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
