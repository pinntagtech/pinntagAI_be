import { env } from "./config/env";
import { buildApp } from "./app";
import { connectMongo } from "./db/connection";
import { logger } from "./utils/logger";

(async () => {
  try {
    await connectMongo();
    const app = buildApp();
    app.listen(env.PORT, () =>
      logger.info(`Pinntag AI listening on :${env.PORT}`)
    );
  } catch (e) {
    logger.error(e, "Failed to start server");
    process.exit(1);
  }
})();
