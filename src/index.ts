import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { connectMongo, getBackendConnection } from "./db/connection.js";
import { logger } from "./utils/logger.js";

(async () => {
  try {
    await connectMongo();

    const backendConn = await getBackendConnection();

    const app = buildApp();
    const server = app.listen(env.PORT, () =>
      logger.info(`Pinntag AI listening on :${env.PORT}`)
    );

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
  } catch (e) {
    logger.error(e, "Failed to start server");
    process.exit(1);
  }
})();
