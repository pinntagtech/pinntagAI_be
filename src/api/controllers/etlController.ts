import { Request, Response } from "express";
import { etlService } from "../services/etl.service";
import { logger } from "../../utils/logger";
import { JobRunRequest } from "../../utils/types/types";
// import { etlService } from '../services/enhanced-etl.service';
// import { logger } from '../utils/logger';
// import { JobRunRequest } from '../types/etl.types';

export class EtlController {
  async health(req: Request, res: Response): Promise<void> {
    try {
      const health = await etlService.health();
      res.json(health);
    } catch (error) {
      logger.error(error, "Health check failed");
      res.status(503).json({ error: "Service unavailable" });
    }
  }

  async runJob(req: Request, res: Response): Promise<void> {
    try {
      const request: JobRunRequest = req.body;
      const result = await etlService.runJob(request);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error({ request: req.body, error }, "Failed to run job");
      res.status(400).json({ error: error.message });
    }
  }

  async getJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const status = await etlService.getJobStatus(jobId);
      res.json(status);
    } catch (error) {
      logger.error(
        { jobId: req.params.jobId, error },
        "Failed to get job status"
      );
      res.status(404).json({ error: "Job not found" });
    }
  }

  async getJobLogs(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const lines = parseInt(req.query.lines as string) || 100;
      const logs = await etlService.getJobLogs(jobId, lines);
      res.json({ logs });
    } catch (error) {
      logger.error(
        { jobId: req.params.jobId, error },
        "Failed to get job logs"
      );
      res.status(404).json({ error: "Job logs not found" });
    }
  }

  async cancelJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      await etlService.cancelJob(jobId);
      res.status(204).send();
    } catch (error: any) {
      logger.error({ jobId: req.params.jobId, error }, "Failed to cancel job");
      res.status(400).json({ error: error.message });
    }
  }

  async listEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = await etlService.listEvents(req.query as any);
      res.json(events);
    } catch (error: any) {
      logger.error({ query: req.query, error }, "Failed to list events");
      res.status(400).json({ error: error.message });
    }
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await etlService.getMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error(error, "Failed to get metrics");
      res.status(500).json({ error: "Failed to get metrics" });
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

export const etlController = new EtlController();
