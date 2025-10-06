import { Router } from "express";
import { etlController } from "../controllers/etlController";
import { validateCreateJobRequest } from "../../middleware/validation";
import { requireAuth, internalApiKeyGuard } from "../../middleware/auth";
// import { etlController } from '../controllers/etl.controller';
// import { validateJobRequest } from '../middleware/validation';

const router = Router();

router.get("/health", etlController.health);

// Enforce internal API key for A->B calls when enabled
router.use(internalApiKeyGuard);

// Backend A -> initiate ETL for a group
router.post("/groups/:groupId/run", etlController.startGroupJob);

// Protect all endpoints below with auth
// Optional additional auth layer (API key/Bearer) if enabled via env
router.use(requireAuth);
router.post("/jobs", validateCreateJobRequest, etlController.createJob);
router.get("/jobs/:jobId", etlController.getJob);
router.get("/jobs", etlController.listJobs);
router.get("/jobs/status/:jobId", etlController.getJobStatus);
router.get("/jobs/logs/:jobId", etlController.getJobLogs);
router.patch("/jobs/pause/:jobId", etlController.pauseJob);
router.patch("/jobs/resume/:jobId", etlController.resumeJob);
router.patch("/jobs/cancel/:jobId", etlController.cancelJob);
router.delete("/jobs/:jobId", etlController.deleteJob);
router.get("/jobs/stream/:jobId", etlController.streamJobProgress);
router.get("/jobs/statistics", etlController.getJobStatistics);
router.post("/jobs/events/:jobId", etlController.addJobEvents);
router.get("/jobs/events/:jobId", etlController.getJobEvents); // Add pagination
router.get("/jobs/all-events/:jobId", etlController.listAllEventsIdToJob);
router.get("/events/:eventId", etlController.getEventById);
router.delete("/jobs/events/:jobId", etlController.deleteJobEvents);
router.get(
  "/jobs/verified-events/:jobId",
  etlController.exportVerifiedJobEvents
);
router.patch("/events/:eventId", etlController.updateEvent);
router.patch("/events/:eventId/verify", etlController.verifyEvent);
router.get("/events", etlController.listEvents);
router.get("/metrics", etlController.getMetrics);

export { router as etlRoutes };
