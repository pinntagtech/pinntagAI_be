// import mongoose from "mongoose";
// import { logger } from "../utils/logger";
// import { env } from "../config/env";

// export const connectMongo = async () => {
//   mongoose.set("strictQuery", true);
//   await mongoose.connect(env.MONGODB_URI);
//   logger.info(`Connected to MongoDB @ ${env.MONGODB_URI}`);
// };

import mongoose, { Connection } from "mongoose";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

/**
 * Primary (default) connection: PinntagAI DB
 * - Keeps existing behavior so current models keep working.
 */
export const connectMongo = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 20,
  });
  logger.info(`Connected to MongoDB (AI) @ ${env.MONGODB_URI}`);
};

/**
 * Ad-hoc secondary connection: PinntagBackend DB (read-mostly)
 * - Lazy-initialized and cached.
 * - Small pool that collapses to zero when idle.
 * - Fast failure if backend DB is unreachable.
 */
let backendConn: Connection | null = null;

export const getBackendConnection = async (): Promise<Connection> => {
  if (backendConn && backendConn.readyState === 1) return backendConn;

  const uri = env.BACKEND_MONGODB_URI;
  if (!uri) {
    throw new Error("BACKEND_MONGODB_URI is not set in env");
  }

  backendConn = await mongoose
    .createConnection(uri, {
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 5000,
    })
    .asPromise();

  backendConn.on("connected", () => {
    logger.info(`Connected to MongoDB (Backend) @ ${uri}`);
  });
  backendConn.on("error", (err) => {
    logger.error({ err }, "MongoDB (Backend) connection error");
  });
  backendConn.on("disconnected", () => {
    logger.warn("MongoDB (Backend) disconnected");
  });

  return backendConn;
};

/**
 * Helpers to close connections gracefully (optional)
 */
export const closeAllMongo = async () => {
  try {
    if (mongoose.connection?.readyState === 1) {
      await mongoose.connection.close();
      logger.info("Closed MongoDB (AI) connection");
    }
  } catch (e) {
    logger.error({ e }, "Error closing AI Mongo connection");
  }
  try {
    if (backendConn && backendConn.readyState === 1) {
      await backendConn.close();
      logger.info("Closed MongoDB (Backend) connection");
    }
  } catch (e) {
    logger.error({ e }, "Error closing Backend Mongo connection");
  }
};

/**
 * Example usage:
 *
 * // 1) app bootstrap
 * await connectMongo(); // AI default
 *
 * // 2) ad-hoc backend read
 * const backendConn = await getBackendConnection();
 * const Business = backendConn.model("Business", businessSchema, "businesses");
 * const biz = await Business.findById(id).lean();
 */
