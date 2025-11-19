import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { connectMongo, getBackendConnection, closeAllMongo } from "./db/connection.js";
import { logger } from "./utils/logger.js";
import { JobScheduler } from "./jobs/scheduler.js";

(async () => {
  try {
    await connectMongo();

    // Initialize backend connection for templates
    await getBackendConnection();

    const app = buildApp();
    const server = app.listen(env.PORT, () =>
      logger.info(`Pinntag AI listening on :${env.PORT}`)
    );

    // Start scheduled jobs (overnight template updates, etc.)
    JobScheduler.start();

    // Gracefully handle server listen errors (for example, EADDRINUSE)
    server.on("error", (err?: NodeJS.ErrnoException) => {
      if (err && err.code === "EADDRINUSE") {
        logger.error(
          err,
          `Port ${env.PORT} is already in use. Stop the process using the port (e.g. \`lsof -i :${env.PORT}\`) or change PORT in your environment and try again.`
        );
        process.exit(1);
      }

      logger.error(err || new Error("Unknown server error"), "Server error");
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down gracefully...");
      JobScheduler.stop();
      server.close(async () => {
        logger.info("HTTP server closed");
        await closeAllMongo();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (e) {
    logger.error(e, "Failed to start server");
    process.exit(1);
  }
})();
