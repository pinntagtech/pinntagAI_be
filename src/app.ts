import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./utils/logger.js";
import cors from "cors";
import indexRouter from "./api/routes/index.routes.js";

// Add CORS and allowed origins as needed
const allowedOrigins = [
  "http://localhost:4200",
  "https://your-frontend-domain.com",
  "https://pre-dev.api.pinntag.com",
  "http://localhost:5173",
];

export const buildApp = () => {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use((pinoHttp as unknown as any)({ logger }));
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, origin);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
    })
  );

  //   app.use("/health", healthRouter);
  //   app.use("/etl", etlRouter);
  //   app.use("/ai", aiRouter);

  // use index routes
  app.use("/", indexRouter);

  app.get("/", (_req, res) =>
    res.json({ success: true, service: "pinntag-ai" })
  );

  // Not found
  app.use((req, res) =>
    res.status(404).json({ success: false, error: "Route Not Found" })
  );

  return app;
};
