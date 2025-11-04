import { Router } from "express";
import { etlService } from "../services/etl.service.js";
import { etlRoutes } from "./etl.routes.js";
import { aiRoutes } from "./ai.routes.js";

// Import your route modules here
// Example:
// import { aiRouter } from '../../routes/ai';

const router = Router();

// Use your routes here
// Example:
// router.use('/ai', aiRouter);
router.use("/etl", etlRoutes);
router.use("/ai", aiRoutes);

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
