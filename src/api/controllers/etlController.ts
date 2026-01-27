import { Request, Response } from "express";
import { etlService } from "../services/etl.service.js";
import { logger } from "../../utils/logger.js";
import { JobRunRequest } from "../../utils/types/types.js";
import { REPLCommand } from "repl";
// import { etlService } from '../services/enhanced-etl.service';
// import { logger } from '../utils/logger';
// import { JobRunRequest } from '../types/etl.types';

export class EtlController {
  // Create Job
  async createJob(req: Request, res: Response): Promise<Response> {
    try {
      const result = await etlService.createJob({ ...req.body });
      return res.status(201).json(result);
    } catch (error: any) {
      logger.error({ request: req.body, error }, "Failed to create job");
      return res.status(400).json({ error: error.message });
    }
  }

  // Get Job
  async getJob(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params;
      const job = await etlService.getJobLocal(jobId);
      return res.json(job);
    } catch (error: any) {
      logger.error({ jobId: req.params.jobId, error }, "Failed to get job");
      return res.status(404).json({ error: error.message });
    }
  }

  // List Jobs
  async listJobs(req: Request, res: Response): Promise<Response> {
    try {
      const jobs = await etlService.listJobsLocal({ ...(req.query as any) });
      return res.json(jobs);
    } catch (error: any) {
      logger.error({ query: req.query, error }, "Failed to list jobs");
      return res.status(400).json({ error: error.message });
    }
  }

  // Resume Job
  async resumeJob(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params;
      await etlService.resumeJob(jobId);
      return res
        .status(200)
        .json({ message: `Job ${jobId} resumed successfully` });
    } catch (error: any) {
      logger.error({ jobId: req.params.jobId, error }, "Failed to resume job");
      return res.status(400).json({ error: error.message });
    }
  }

  // Delete Job
  async deleteJob(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params;
      await etlService.deleteJob(jobId);
      return res.status(204).send();
    } catch (error: any) {
      logger.error({ jobId: req.params.jobId, error }, "Failed to delete job");
      return res.status(400).json({ error: error.message });
    }
  }

  // Stream Job Progress
  streamJobProgress(req: Request, res: Response): void {
    const { jobId } = req.params;
    const ws = etlService.streamJobProgress(jobId);
    ws.on("message", (data: Buffer) => {
      res.write(data);
    });
    ws.on("close", () => res.end());
    req.on("close", () => ws.close());
  }

  // Get Job Statistics
  async getJobStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await etlService.getJobStatistics();
      return res.json(stats);
    } catch (error: any) {
      logger.error({ error }, "Failed to get job statistics");
      return res.status(400).json({ error: error.message });
    }
  }
  async health(req: Request, res: Response): Promise<Response> {
    try {
      const health = await etlService.health();
      return res.json(health);
    } catch (error) {
      logger.error(error, "Health check failed");
      return res.status(503).json({ error: "Service unavailable" });
    }
  }

  async runJob(req: Request, res: Response): Promise<Response> {
    try {
      const request: JobRunRequest = req.body;
      const result = await etlService.runJob(request);
      return res.status(201).json(result);
    } catch (error: any) {
      logger.error({ request: req.body, error }, "Failed to run job");
      return res.status(400).json({ error: error.message });
    }
  }

  // Backend A -> Register+Start job for a group (shared DB)
  async startGroupJob(req: Request, res: Response): Promise<Response> {
    try {
      const { groupId } = req.params;
      if (!groupId) return res.status(400).json({ error: "groupId required" });
      const parameters = (req.body && req.body.parameters) || {};
      const priority = (req.body && req.body.priority) || "normal";
      const metadata = (req.body && req.body.metadata) || undefined;
      const result = await etlService.registerAndStartGroupJob({
        groupId,
        parameters,
        priority,
        metadata,
      } as any);
      return res.status(201).json(result);
    } catch (error: any) {
      logger.error(
        { params: req.params, body: req.body, error },
        "Failed to register/start group job"
      );
      return res.status(400).json({ error: error.message });
    }
  }

  async getJobStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params;
      const status = await etlService.getJobStatus(jobId);
      return res.json(status);
    } catch (error) {
      logger.error(
        { jobId: req.params.jobId, error },
        "Failed to get job status"
      );
      return res.status(404).json({ error: "Job not found" });
    }
  }

  async getJobLogs(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params;
      const lines = parseInt(req.query.lines as string) || 100;
      const logs = await etlService.getJobLogs(jobId, lines);
      return res.json({ logs });
    } catch (error) {
      logger.error(
        { jobId: req.params.jobId, error },
        "Failed to get job logs"
      );
      return res.status(404).json({ error: "Job logs not found" });
    }
  }

  async pauseJob(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params;
      await etlService.pauseJob(jobId);
      return res
        .status(200)
        .json({ message: `Job ${jobId} paused successfully` });
    } catch (error: any) {
      logger.error({ jobId: req.params.jobId, error }, "Failed to pause job");
      return res.status(400).json({ error: error.message });
    }
  }

  async cancelJob(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params;
      await etlService.cancelJob(jobId);
      return res.status(204).send();
    } catch (error: any) {
      logger.error({ jobId: req.params.jobId, error }, "Failed to cancel job");
      return res.status(400).json({ error: error.message });
    }
  }

  async listEvents(req: Request, res: Response): Promise<Response> {
    try {
      const events = await etlService.listEvents(req.query as any);
      return res.json(events);
    } catch (error: any) {
      logger.error({ query: req.query, error }, "Failed to list events");
      return res.status(400).json({ error: error.message });
    }
  }

  async addJobEvents(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params;
      const events = Array.isArray(req.body) ? req.body : req.body?.events;
      if (!Array.isArray(events)) {
        return res.status(400).json({
          error: "Body must be an array of events or {events: [...]}",
        });
      }
      const result = await etlService.addEventsToJob(jobId, events);
      return res.status(201).json(result);
    } catch (error: any) {
      logger.error(
        { jobId: req.params.jobId, error },
        "Failed to add job events"
      );
      return res.status(400).json({ error: error.message });
    }
  }

  async getJobEvents(req: Request, res: Response): Promise<Response> {
    try {
      // Pagination
      const { page = 1, limit = 10 } = req.query as any;
      const { jobId } = req.params;
      const { verified, exported } = req.query as any;
      if (verified !== undefined || exported !== undefined) {
        const v = verified !== undefined ? verified === "true" : undefined;
        const ex = exported !== undefined ? exported === "true" : undefined;
        logger.info(
          { jobId, verified: v, exported: ex },
          "Fetching events with filters"
        );
        const result = await etlService.listJobEventsFiltered(jobId, {
          verified: v,
          exported: ex,
        });
        logger.info(result);
        return res.json(result);
      } else {
        logger.info("Fetching all events without filters");
        const result = await etlService.listJobEvents(jobId, page, limit);
        logger.info(result);
        return res.json(result);
      }
    } catch (error: any) {
      logger.error(
        { jobId: req.params.jobId, error },
        "Failed to get job events"
      );
      return res.status(404).json({ error: error.message });
    }
  }

  async listAllEventsIdToJob(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params as any;
      if (!jobId) return res.status(400).json({ error: "jobId required" });
      const result: any = await etlService.listAllEventsIdToJob(jobId);
      if (result.length === 0)
        return res.status(404).json({ error: "Job not found" });
      return res.json(result);
    } catch (error: any) {
      logger.error(
        { jobId: req.params.jobId, error },
        "Failed to list all events for job"
      );
      return res.status(400).json({ error: error.message });
    }
  }

  async getEventById(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params as any;
      if (!eventId) return res.status(400).json({ error: "eventId required" });
      const event = await etlService.getEventById(eventId);
      return res.json(event);
    } catch (error: any) {
      logger.error(
        { eventId: req.params.eventId, error },
        "Failed to get event by ID"
      );
      return res.status(404).json({ error: error.message });
    }
  }

  async deleteJobEvents(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params as any;
      const result = await etlService.deleteEventsForJob(jobId);
      return res.json(result);
    } catch (error: any) {
      logger.error(
        { jobId: req.params.jobId, error },
        "Failed to delete job events"
      );
      return res.status(400).json({ error: error.message });
    }
  }

  async updateEvent(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params as any;
      const updated = await etlService.updateEvent(eventId, req.body || {});
      return res.json(updated);
    } catch (error: any) {
      logger.error({ params: req.params, error }, "Failed to update event");
      return res.status(400).json({ error: error.message });
    }
  }

  async verifyEvent(req: Request, res: Response): Promise<Response> {
    try {
      const { eventId } = req.params as any;
      const { verified, verifiedBy } = req.body || {};
      if (typeof verified !== "boolean") {
        return res.status(400).json({ error: "verified(boolean) required" });
      }
      const updated = await etlService.verifyEvent(
        eventId,
        verified,
        verifiedBy
      );
      return res.json(updated);
    } catch (error: any) {
      logger.error({ params: req.params, error }, "Failed to verify event");
      return res.status(400).json({ error: error.message });
    }
  }

  async exportVerifiedJobEvents(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { jobId } = req.params as any;
      const markExported = (req.query.markExported as string) === "true";
      const result = await etlService.exportVerifiedEvents(jobId, {
        markExported,
      });
      return res.json(result);
    } catch (error: any) {
      logger.error(
        { params: req.params, error },
        "Failed to export verified events"
      );
      return res.status(400).json({ error: error.message });
    }
  }

  async getMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const metrics = await etlService.getMetrics();
      return res.json(metrics);
    } catch (error) {
      logger.error(error, "Failed to get metrics");
      return res.status(400).json({ error: "Failed to get metrics" });
    }
  }

  // Server-Sent Events endpoint for job streaming
  streamJobStatus(req: Request, res: Response): void {
    const { jobId } = req.params;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    // Start streaming for this job
    etlService.streamJobStatus(jobId);

    const handleUpdate = (update: any) => {
      if (update.jobId === jobId) {
        res.write(`data: ${JSON.stringify(update)}\n\n`);
      }
    };

    etlService.on("jobUpdate", handleUpdate);

    // Handle client disconnect
    req.on("close", () => {
      etlService.removeListener("jobUpdate", handleUpdate);
      res.end();
    });
  }
}

const controller = new EtlController();
export const etlController = {
  health: controller.health.bind(controller),
  createJob: controller.createJob.bind(controller),
  getJob: controller.getJob.bind(controller),
  listJobs: controller.listJobs.bind(controller),
  pauseJob: controller.pauseJob.bind(controller),
  resumeJob: controller.resumeJob.bind(controller),
  cancelJob: controller.cancelJob.bind(controller),
  deleteJob: controller.deleteJob.bind(controller),
  streamJobProgress: controller.streamJobProgress.bind(controller),
  getJobStatistics: controller.getJobStatistics.bind(controller),
  getJobStatus: controller.getJobStatus.bind(controller),
  getJobLogs: controller.getJobLogs.bind(controller),
  listEvents: controller.listEvents.bind(controller),
  addJobEvents: controller.addJobEvents.bind(controller),
  getJobEvents: controller.getJobEvents.bind(controller),
  listAllEventsIdToJob: controller.listAllEventsIdToJob.bind(controller),
  getEventById: controller.getEventById.bind(controller),
  deleteJobEvents: controller.deleteJobEvents.bind(controller),
  updateEvent: controller.updateEvent.bind(controller),
  verifyEvent: controller.verifyEvent.bind(controller),
  exportVerifiedJobEvents: controller.exportVerifiedJobEvents.bind(controller),
  getMetrics: controller.getMetrics.bind(controller),
  streamJobStatus: controller.streamJobStatus.bind(controller),
  startGroupJob: controller.startGroupJob.bind(controller),
};

/*
cURL Requests for testing the endpoints:

Health Check:
curl -X GET http://localhost:3000/api/etl/health

Run Job:
curl -X POST http://localhost:3000/api/etl/jobs -H "Content-Type: application/json" -d '{"source": "source_id", "destination": "destination_id"}'

Get Job Status:
curl -X GET http://localhost:3000/api/etl/jobs/job_id/status

Get Job Logs:
curl -X GET http://localhost:3000/api/etl/jobs/job_id/logs

Cancel Job:
curl -X POST http://localhost:3000/api/etl/jobs/job_id/cancel

List Events:
curl -X GET http://localhost:3000/api/etl/events

Get Metrics:
curl -X GET http://localhost:3000/api/etl/metrics 

*/
