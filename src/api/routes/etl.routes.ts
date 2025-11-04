import { Router } from "express";
import { etlController } from "../controllers/etlController.js";
import { validateCreateJobRequest } from "../../middleware/validation.js";
import { requireAuth, internalApiKeyGuard } from "../../middleware/auth.js";
// import { etlController } from '../controllers/etl.controller';
// import { validateJobRequest } from '../middleware/validation';

const etlRouter = Router();

etlRouter.get("/health", etlController.health);

// Enforce internal API key for A->B calls when enabled
etlRouter.use(internalApiKeyGuard);

// Backend A -> initiate ETL for a group
etlRouter.post("/groups/:groupId/run", etlController.startGroupJob);

// Protect all endpoints below with auth
// Optional additional auth layer (API key/Bearer) if enabled via env
etlRouter.use(requireAuth);
etlRouter.post("/jobs", validateCreateJobRequest, etlController.createJob);
etlRouter.get("/jobs/:jobId", etlController.getJob);
etlRouter.get("/jobs", etlController.listJobs);
etlRouter.get("/jobs/status/:jobId", etlController.getJobStatus);
etlRouter.get("/jobs/logs/:jobId", etlController.getJobLogs);
etlRouter.patch("/jobs/pause/:jobId", etlController.pauseJob);
etlRouter.patch("/jobs/resume/:jobId", etlController.resumeJob);
etlRouter.patch("/jobs/cancel/:jobId", etlController.cancelJob);
etlRouter.delete("/jobs/:jobId", etlController.deleteJob);
etlRouter.get("/jobs/stream/:jobId", etlController.streamJobProgress);
etlRouter.get("/jobs/statistics", etlController.getJobStatistics);
etlRouter.post("/jobs/events/:jobId", etlController.addJobEvents);
etlRouter.get("/jobs/events/:jobId", etlController.getJobEvents); // Add pagination
etlRouter.get("/jobs/all-events/:jobId", etlController.listAllEventsIdToJob);
etlRouter.get("/events/:eventId", etlController.getEventById);
etlRouter.delete("/jobs/events/:jobId", etlController.deleteJobEvents);
etlRouter.get(
  "/jobs/verified-events/:jobId",
  etlController.exportVerifiedJobEvents
);
etlRouter.patch("/events/:eventId", etlController.updateEvent);
etlRouter.patch("/events/:eventId/verify", etlController.verifyEvent);
etlRouter.get("/events", etlController.listEvents);
etlRouter.get("/metrics", etlController.getMetrics);

export { etlRouter as etlRoutes };
