import { Router } from "express";
import { etlService } from "../services/etl.service.js";
import { etlRoutes } from "./etl.routes.js";
import { aiRoutes } from "./ai.routes.js";
import { aiTrainingRoutes } from "./aiTraining.routes.js";
import templateRoutes from "./template.routes.js";
import { engagementRoutes } from "./engagement.routes.js";
import { consumerAIRoutes } from "./consumerAI.routes.js";
import aiAssistRoutes from "./aiAssist.routes.js";
import { facebookRoutes } from "./facebook.routes.js";
import checkInRoutes from "./checkIn.routes.js";
import contentAssistRoutes from "./contentAssist.routes.js";

// Import your route modules here
// Example:
// import { aiRouter } from '../../routes/ai';

const router = Router();

// Use your routes here
// Example:
// router.use('/ai', aiRouter);
router.use("/etl", etlRoutes);
router.use("/ai", aiRoutes);
router.use("/ai/training", aiTrainingRoutes);
router.use("/ai-assist", aiAssistRoutes);
router.use("/templates", templateRoutes);
router.use("/engagement", engagementRoutes);
router.use("/consumer-ai", consumerAIRoutes);
router.use("/facebook", facebookRoutes);
router.use("/checkin", checkInRoutes);
router.use("/content-assist", contentAssistRoutes);

// Setup global event handlers
etlService.on("jobUpdate", (update) => {
  console.log("Job update:", update);
});

etlService.on("statusChange", (update) => {
  console.log("Status changed:", update.status);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await etlService.shutdown();
  process.exit(0);
});

export default router;
