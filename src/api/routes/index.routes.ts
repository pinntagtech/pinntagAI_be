import { Router } from "express";
import { etlService } from "../services/etl.service";
import { etlRoutes } from "./etl.routes";

// Import your route modules here
// Example:
// import { aiRouter } from '../../routes/ai';

const router = Router();

// Use your routes here
// Example:
// router.use('/ai', aiRouter);
router.use("/etl", etlRoutes);
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
// router.use('/health', healthRouter);

// router.use('/users', userRoutes);
// router.use('/auth', authRoutes);

export default router;
