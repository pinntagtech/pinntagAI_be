import { Router } from "express";
import { etlController } from "../controllers/etlController";
import { validateJobRequest } from "../../middleware/validation";
// import { etlController } from '../controllers/etl.controller';
// import { validateJobRequest } from '../middleware/validation';

const router = Router();

router.get("/health", etlController.health);
router.post("/jobs/run", validateJobRequest, etlController.runJob);
router.get("/jobs/:jobId/status", etlController.getJobStatus);
router.get("/jobs/:jobId/logs", etlController.getJobLogs);
router.post("/jobs/:jobId/cancel", etlController.cancelJob);
router.get("/jobs/:jobId/stream", etlController.streamJobStatus);
router.get("/events", etlController.listEvents);
router.get("/metrics", etlController.getMetrics);

export { router as etlRoutes };
